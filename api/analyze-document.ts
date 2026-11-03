
import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createHash } from 'crypto';

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MODEL_NAME = 'gemini-3.5-flash-lite';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ExtractedDocument {
  documentType: string;
  ownerName: string;
  issueDate: string | null;
  expiryDate: string | null;
  income: number | null;
  cgpa: string | null;
  issuingAuthority: string | null;
  institution: string | null;
  additionalData: Record<string, unknown> | null;
  _extractedByAI: boolean;
}

interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type UploadRequest = VercelRequest & {
  file?: UploadedFile;
  body: {
    slotId?: string;
  };
};

// ------------------------------------------------------------
// Multer configuration
// ------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ------------------------------------------------------------
// Best-effort in-memory cache
// Identical files share a result within the same function instance.
// This is not a global or permanent cache.
// ------------------------------------------------------------

const geminiCache = new Map<
  string,
  Promise<ExtractedDocument>
>();

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256')
    .update(buffer)
    .digest('hex');
}

// ------------------------------------------------------------
// Gemini document analysis
// ------------------------------------------------------------

async function analyzeDocument(
  file: UploadedFile,
  apiKey: string
): Promise<ExtractedDocument> {

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a document verification AI.

Analyze the provided document image or PDF and extract
structured information.

Return ONLY a valid JSON object with these fields:

{
  "documentType": "one of: academic_marksheet, income_certificate, bonafide_certificate, bank_passbook, cancelled_cheque, fee_receipt, admit_card, id_card, utility_bill, driving_license, passport, unknown",
  "ownerName": "full name or null",
  "issueDate": "ISO date YYYY-MM-DD or null",
  "expiryDate": "ISO date YYYY-MM-DD or null",
  "income": "annual income as integer INR if applicable, otherwise null",
  "cgpa": "CGPA as a string if applicable, otherwise null",
  "issuingAuthority": "issuing authority or null",
  "institution": "educational institution or null",
  "additionalData": {}
}

IMPORTANT RULES:

1. Identify the document based on its actual contents,
   not its filename or intended upload category.

2. A fee receipt is NOT an income certificate.

3. An academic marksheet is NOT a bonafide certificate.

4. If the document cannot be identified confidently,
   use "unknown".

5. Do not guess or assume information.

6. Only extract facts visible in the document.

7. Return only the JSON object. Do not include Markdown
   or explanations.
`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
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
    extracted = JSON.parse(response.text);
  } catch {
    throw new Error('Gemini returned an invalid JSON response');
  }

  if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
    throw new Error('Gemini returned an invalid document structure');
  }

  const validTypes = [
    'academic_marksheet',
    'income_certificate',
    'bonafide_certificate',
    'bank_passbook',
    'cancelled_cheque',
    'fee_receipt',
    'admit_card',
    'id_card',
    'utility_bill',
    'driving_license',
    'passport',
    'unknown',
  ];

  if (!validTypes.includes(extracted.documentType)) {
    extracted.documentType = 'unknown';
  }

  const result: ExtractedDocument = {
    documentType: extracted.documentType,
    ownerName: typeof extracted.ownerName === 'string'
      ? extracted.ownerName
      : '',
    issueDate: typeof extracted.issueDate === 'string'
      ? extracted.issueDate
      : null,
    expiryDate: typeof extracted.expiryDate === 'string'
      ? extracted.expiryDate
      : null,
    income: typeof extracted.income === 'number'
      ? extracted.income
      : null,
    cgpa: extracted.cgpa != null
      ? String(extracted.cgpa)
      : null,
    issuingAuthority: typeof extracted.issuingAuthority === 'string'
      ? extracted.issuingAuthority
      : null,
    institution: typeof extracted.institution === 'string'
      ? extracted.institution
      : null,
    additionalData:
      extracted.additionalData &&
      typeof extracted.additionalData === 'object' &&
      !Array.isArray(extracted.additionalData)
        ? extracted.additionalData
        : null,
    _extractedByAI: true,
  };

  return result;
}

// ------------------------------------------------------------
// Vercel API handler
// ------------------------------------------------------------

// Disable automatic request-body parsing so Multer can read
// the incoming multipart/form-data stream.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use POST.',
    });
  }

  // Parse the uploaded file.
  upload.single('file')(
    req as any,
    res as any,
    async (uploadError: any) => {

      if (uploadError) {
        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File is too large. Maximum allowed size is 4 MB.',
          });
        }

        return res.status(400).json({
          error: uploadError.message || 'File upload failed',
        });
      }

      const uploadReq = req as UploadRequest;
      const file = uploadReq.file;
      const slotId = uploadReq.body?.slotId || '';

      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded. Expected form field named "file".',
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Unsupported file type. Upload a PDF, JPG, PNG or WebP file.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || !apiKey.trim()) {
        console.error('[ProofPilot] GEMINI_API_KEY is missing');

        return res.status(500).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const contentHash = hashBuffer(file.buffer);

      try {
        let analysisPromise = geminiCache.get(contentHash);

        if (analysisPromise) {
          console.log(
            `[GEMINI] Cache hit: ${file.originalname} (slot: ${slotId})`
          );
        } else {
          console.log(
            `[GEMINI] Analyzing: ${file.originalname} ` +
            `(slot: ${slotId}, hash: ${contentHash.slice(0, 8)})`
          );

          analysisPromise = analyzeDocument(file, apiKey);

          geminiCache.set(contentHash, analysisPromise);
        }

        const extracted = await analysisPromise;

        console.log(
          `[GEMINI] Completed: ${file.originalname} -> ${extracted.documentType}`
        );

        return res.status(200).json(extracted);

      } catch (error: any) {
        // Remove failed results so a later request can try again.
        geminiCache.delete(contentHash);

        const message = error?.message || String(error);

        const status = Number(
          error?.status || error?.statusCode || error?.code
        );

        const isQuotaError =
          status === 429 ||
          message.includes('429') ||
          message.includes('RESOURCE_EXHAUSTED') ||
          message.toLowerCase().includes('quota') ||
          message.toLowerCase().includes('daily limit');

        if (isQuotaError) {
          console.error(
            `[GEMINI] Quota exceeded for ${file.originalname}`
          );

          return res.status(429).json({
            error: 'Gemini quota exceeded. Wait for quota reset or use a different API key.',
            _quotaExhausted: true,
            documentType: 'unknown',
            ownerName: '',
            issueDate: null,
            _extractedByAI: false,
          });
        }

        console.error(
          `[GEMINI] Analysis failed for ${file.originalname}:`,
          message
        );

        return res.status(502).json({
          error: 'AI document extraction failed. Check the server logs.',
          documentType: 'unknown',
          ownerName: '',
          issueDate: null,
          _extractedByAI: false,
        });
      }
    }
  );
}
