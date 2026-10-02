import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

// ============================================================
// Vite API Plugin — Document Analysis Endpoint
// POST /api/analyze-document
//
// CALL GUARANTEE:
//   - Exactly ONE Gemini request per unique file content.
//   - File buffer is SHA-256 hashed. Cache hit → reuse JSON, no API call.
//   - "[GEMINI] analyzing <filename>" logs BEFORE every real Gemini call.
//   - 429 quota errors are returned immediately, not retried.
// ============================================================

// ── In-process content cache ────────────────────────────────
// Survives re-renders and React StrictMode double-invocations.
// Keyed on SHA-256 of raw file bytes.
const geminiCache = new Map<string, Record<string, any>>();

function hashBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function apiPlugin() {
  const upload = multer({ storage: multer.memoryStorage() });

  return {
    name: 'api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/analyze-document', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();

        upload.single('file')(req, res, async (err: any) => {
          if (err) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: err.message }));
          }

          if (!req.file) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'No file uploaded' }));
          }

          const file = req.file;
          // slotId is for logging only — never determines document type.
          const slotId: string = req.body.slotId || '';
          const apiKey = process.env.GEMINI_API_KEY;

          // ── No API key: deterministic fallback ──────────────
          if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
            console.log(`[ProofPilot] No Gemini API key — fallback for slot "${slotId}" (${file.originalname})`);
            const fallback = {
              documentType: 'unknown',
              ownerName: '',
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: undefined,
              income: undefined,
              cgpa: undefined,
              issuingAuthority: undefined,
              institution: undefined,
              additionalData: { note: 'No API key configured — AI extraction unavailable' },
              _extractedByAI: false,
            };
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(fallback));
          }

          // ── Content-hash cache check ─────────────────────────
          // Same file bytes → return cached result, zero Gemini calls.
          const contentHash = hashBuffer(file.buffer);
          if (geminiCache.has(contentHash)) {
            console.log(`[GEMINI] cache hit for "${file.originalname}" (slot: ${slotId}) — reusing cached result`);
            const cached = geminiCache.get(contentHash)!;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }

          // ── Real Gemini call ─────────────────────────────────
          // This line appears EXACTLY ONCE per unique file content.
          console.log(`[GEMINI] analyzing "${file.originalname}" (slot: ${slotId}, hash: ${contentHash.slice(0, 8)}…)`);

          try {
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `You are a document verification AI. Analyze the provided document image/PDF and extract structured information.

Return ONLY a valid JSON object with these fields (use null for fields you cannot determine):
{
  "documentType": "<one of: academic_marksheet | income_certificate | bonafide_certificate | bank_passbook | cancelled_cheque | fee_receipt | admit_card | id_card | utility_bill | driving_license | passport | unknown>",
  "ownerName": "<full name of the person this document belongs to, or null>",
  "issueDate": "<ISO date YYYY-MM-DD or null>",
  "expiryDate": "<ISO date YYYY-MM-DD or null — only if document has explicit expiry>",
  "income": <annual income as integer INR if income_certificate, else null>,
  "cgpa": "<CGPA as string e.g. '8.4' if academic_marksheet, else null>",
  "issuingAuthority": "<who issued this document, or null>",
  "institution": "<name of educational institution if applicable, else null>",
  "additionalData": {}
}

CRITICAL RULES:
- documentType must reflect what the document ACTUALLY IS based on content, NOT what the user intended to upload.
- A fee receipt is NOT an income certificate even if named "income_certificate.pdf".
- An academic marksheet is NOT a bonafide certificate.
- If the document content does not clearly match any type, use "unknown".
- Do NOT guess or assume. Only extract facts visible in the document.
- Return ONLY the JSON object. No markdown, no explanation.`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: file.mimetype,
                    data: file.buffer.toString('base64'),
                  },
                },
              ],
              config: {
                responseMimeType: 'application/json',
              },
            });

            if (!response.text) {
              throw new Error('Empty response from Gemini');
            }

            let extracted: Record<string, any>;
            try {
              const cleaned = response.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
              extracted = JSON.parse(cleaned);
            } catch {
              throw new Error('Gemini returned non-JSON response');
            }

            extracted._extractedByAI = true;

            if (!extracted.documentType || typeof extracted.documentType !== 'string') {
              extracted.documentType = 'unknown';
            }

            // Cache so the same bytes never hit Gemini again
            geminiCache.set(contentHash, extracted);
            console.log(`[GEMINI] done "${file.originalname}" → type: ${extracted.documentType}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(extracted));

          } catch (error: any) {
            const msg: string = error?.message || String(error);

            // ── 429 / Daily quota — no retry ─────────────────────
            const isQuotaError =
              msg.includes('429') ||
              msg.includes('RESOURCE_EXHAUSTED') ||
              msg.toLowerCase().includes('quota') ||
              msg.toLowerCase().includes('daily limit');

            if (isQuotaError) {
              console.error(`[GEMINI] ⛔ QUOTA EXCEEDED for "${file.originalname}" — NOT retrying.`);
              res.statusCode = 429;
              return res.end(JSON.stringify({
                error: 'Gemini daily quota exceeded. Wait for quota reset or use a different API key.',
                _quotaExhausted: true,
                documentType: 'unknown',
                ownerName: '',
                issueDate: null,
                _extractedByAI: false,
              }));
            }

            console.error(`[GEMINI] error analyzing "${file.originalname}":`, msg);
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: `AI extraction failed: ${msg}`,
              documentType: 'unknown',
              ownerName: '',
              issueDate: null,
              _extractedByAI: false,
            }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
});
