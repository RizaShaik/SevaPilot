// ============================================================
// ProofPilot — Verification Engine
// Deterministic, data-driven checks
// All decisions made from actual data — nothing hardcoded
// ============================================================

import type {
  ScholarshipApplication,
  UploadedDocument,
  VerificationResult,
  VerificationReport,
  ActionItem,
  RiskLevel,
} from './types';
import {
  SCHOLARSHIP_REQUIREMENTS,
  formatCurrency,
  formatDocType,
  isExpired,
  isNearExpiry,
  namesMatch,
  daysUntilExpiry,
} from './data';

// ============================================================
// Field validation checks
// ============================================================

function checkFields(
  app: ScholarshipApplication,
  results: VerificationResult[]
) {
  // CGPA
  if (!app.cgpa) {
    results.push({
      id: 'cgpa_missing',
      category: 'field',
      status: 'fail',
      severity: 'critical',
      title: 'CGPA Not Provided',
      explanation: 'The CGPA field is empty. This is required to verify scholarship eligibility.',
      evidence: 'Form field: CGPA = (empty)',
      recommendation: 'Enter your current CGPA in the application form.',
    });
  } else {
    const cgpa = parseFloat(app.cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      results.push({
        id: 'cgpa_invalid',
        category: 'field',
        status: 'fail',
        severity: 'critical',
        title: 'Invalid CGPA',
        explanation: `"${app.cgpa}" is not a valid CGPA. Must be a number between 0 and 10.`,
        evidence: `Form field: CGPA = "${app.cgpa}"`,
        recommendation: 'Enter a valid numeric CGPA (e.g. 8.4).',
      });
    } else if (cgpa < SCHOLARSHIP_REQUIREMENTS.minCGPA) {
      results.push({
        id: 'cgpa_low',
        category: 'eligibility',
        status: 'fail',
        severity: 'critical',
        title: 'CGPA Below Minimum Requirement',
        explanation: `Your CGPA of ${cgpa} does not meet the minimum requirement of ${SCHOLARSHIP_REQUIREMENTS.minCGPA} for this scholarship.`,
        evidence: `Applicant CGPA: ${cgpa} | Required: ≥ ${SCHOLARSHIP_REQUIREMENTS.minCGPA}`,
        recommendation: 'This scholarship requires a minimum CGPA of 7.5. Review other scholarships with lower thresholds.',
        relatedSlot: 'marksheet',
      });
    } else {
      results.push({
        id: 'cgpa_ok',
        category: 'eligibility',
        status: 'pass',
        severity: 'info',
        title: 'CGPA Meets Requirement',
        explanation: `CGPA ${cgpa} meets the minimum requirement of ${SCHOLARSHIP_REQUIREMENTS.minCGPA}.`,
        evidence: `Applicant CGPA: ${cgpa} | Required: ≥ ${SCHOLARSHIP_REQUIREMENTS.minCGPA}`,
        recommendation: '',
        relatedSlot: 'marksheet',
      });
    }
  }

  // Income (form field)
  if (!app.annualIncome) {
    results.push({
      id: 'income_missing',
      category: 'field',
      status: 'fail',
      severity: 'critical',
      title: 'Annual Income Not Provided',
      explanation: 'Annual family income is required to determine scholarship eligibility.',
      evidence: 'Form field: Annual Income = (empty)',
      recommendation: 'Enter the annual family income in the application form.',
      relatedSlot: 'income_certificate',
    });
  } else {
    const income = parseFloat(String(app.annualIncome).replace(/,/g, ''));
    if (isNaN(income) || income < 0) {
      results.push({
        id: 'income_invalid',
        category: 'field',
        status: 'fail',
        severity: 'critical',
        title: 'Invalid Income Value',
        explanation: `"${app.annualIncome}" is not a valid income amount.`,
        evidence: `Form field: Annual Income = "${app.annualIncome}"`,
        recommendation: 'Enter a valid positive numeric income in INR.',
        relatedSlot: 'income_certificate',
      });
    } else if (income > SCHOLARSHIP_REQUIREMENTS.maxIncome) {
      results.push({
        id: 'income_exceeded',
        category: 'eligibility',
        status: 'fail',
        severity: 'critical',
        title: 'Income Exceeds Eligibility Limit',
        explanation: `Declared income ${formatCurrency(income)} exceeds the maximum allowed ${formatCurrency(SCHOLARSHIP_REQUIREMENTS.maxIncome)}.`,
        evidence: `Form income: ${formatCurrency(income)} | Limit: ≤ ${formatCurrency(SCHOLARSHIP_REQUIREMENTS.maxIncome)}`,
        recommendation: 'This application does not meet the income eligibility criterion.',
        relatedSlot: 'income_certificate',
      });
    } else {
      results.push({
        id: 'income_ok',
        category: 'eligibility',
        status: 'pass',
        severity: 'info',
        title: 'Income Within Eligibility Range',
        explanation: `Declared income ${formatCurrency(income)} is within the allowed limit.`,
        evidence: `Form income: ${formatCurrency(income)} | Limit: ≤ ${formatCurrency(SCHOLARSHIP_REQUIREMENTS.maxIncome)}`,
        recommendation: '',
        relatedSlot: 'income_certificate',
      });
    }
  }

  // Required form fields
  const requiredFields: Array<[keyof ScholarshipApplication, string]> = [
    ['fullName', 'Full Name'],
    ['dob', 'Date of Birth'],
    ['gender', 'Gender'],
    ['email', 'Email Address'],
    ['phone', 'Phone Number'],
    ['aadhaar', 'Aadhaar Number'],
    ['institution', 'Institution Name'],
    ['course', 'Course'],
    ['year', 'Year of Study'],
    ['rollNumber', 'Roll Number'],
    ['parentName', 'Parent/Guardian Name'],
    ['bankName', 'Bank Name'],
    ['accountNumber', 'Bank Account Number'],
    ['ifsc', 'IFSC Code'],
  ];

  const missingFields = requiredFields.filter(([key]) => !app[key]);
  if (missingFields.length > 0) {
    results.push({
      id: 'required_fields',
      category: 'field',
      status: 'fail',
      severity: 'critical',
      title: `${missingFields.length} Required Field(s) Missing`,
      explanation: `The following fields are empty: ${missingFields.map(([, label]) => label).join(', ')}.`,
      evidence: `Missing: ${missingFields.map(([, label]) => label).join(', ')}`,
      recommendation: 'Complete all required form fields before submitting.',
    });
  } else {
    results.push({
      id: 'required_fields_ok',
      category: 'field',
      status: 'pass',
      severity: 'info',
      title: 'All Required Fields Completed',
      explanation: 'All mandatory form fields are filled in.',
      evidence: 'Form completeness: 100%',
      recommendation: '',
    });
  }

  // Format validations (phone, aadhaar, IFSC)
  if (app.phone && !/^\d{10}$/.test(app.phone.replace(/\D/g, ''))) {
    results.push({
      id: 'phone_invalid',
      category: 'field',
      status: 'warn',
      severity: 'warning',
      title: 'Phone Number Format Invalid',
      explanation: 'Phone number must be exactly 10 digits.',
      evidence: `Provided: "${app.phone}"`,
      recommendation: 'Enter a valid 10-digit mobile number.',
    });
  }

  if (app.aadhaar && !/^\d{12}$/.test(app.aadhaar.replace(/\D/g, ''))) {
    results.push({
      id: 'aadhaar_invalid',
      category: 'field',
      status: 'warn',
      severity: 'warning',
      title: 'Aadhaar Number Format Invalid',
      explanation: 'Aadhaar must be exactly 12 digits.',
      evidence: `Provided: "${app.aadhaar.replace(/\d/g, '*')}"`,
      recommendation: 'Enter a valid 12-digit Aadhaar number.',
    });
  }

  if (app.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(app.ifsc.toUpperCase().trim())) {
    results.push({
      id: 'ifsc_invalid',
      category: 'field',
      status: 'warn',
      severity: 'warning',
      title: 'IFSC Code Format Invalid',
      explanation: 'IFSC must be 11 characters: 4 letters, then 0, then 6 alphanumeric characters.',
      evidence: `Provided: "${app.ifsc}"`,
      recommendation: 'Enter a valid IFSC code (format: ABCD0123456).',
    });
  }
}

// ============================================================
// Document checks
// ============================================================

function checkDocuments(
  app: ScholarshipApplication,
  documents: UploadedDocument[],
  results: VerificationResult[]
) {
  const req = SCHOLARSHIP_REQUIREMENTS;
  const uploadedSlots = new Set(documents.map(d => d.slotId));

  // 1. Completeness — are all required documents uploaded?
  for (const slot of req.requiredDocuments) {
    if (!uploadedSlots.has(slot.id)) {
      results.push({
        id: `missing_${slot.id}`,
        category: 'completeness',
        status: 'fail',
        severity: 'critical',
        title: `Missing: ${slot.label}`,
        explanation: `The ${slot.label} has not been uploaded. This document is mandatory for the scholarship application.`,
        evidence: `Required document slot "${slot.id}" is empty`,
        recommendation: `Upload a valid ${slot.label} issued by the appropriate authority.`,
        relatedSlot: slot.id,
      });
    }
  }

  // 2. Per-document checks
  for (const doc of documents) {
    const slot = req.requiredDocuments.find(s => s.id === doc.slotId);
    if (!slot) continue;

    // 2a. Document type check — CRITICAL: filename does NOT matter, only detected type
    if (!slot.allowedTypes.includes(doc.metadata.documentType)) {
      const detected = formatDocType(doc.metadata.documentType);
      const expected = slot.allowedTypes.map(formatDocType).join(' or ');
      results.push({
        id: `wrong_type_${doc.slotId}`,
        category: 'document_type',
        status: 'fail',
        severity: 'critical',
        title: `Wrong Document: ${slot.label}`,
        explanation: `A "${detected}" was uploaded in the "${slot.label}" slot. This document cannot satisfy this requirement — the content, not the filename, was analyzed.`,
        evidence: `File: "${doc.file.name}" | Detected type: "${detected}" | Expected: "${expected}"`,
        recommendation: `Remove the "${detected}" and upload a genuine ${slot.label}.`,
        relatedSlot: slot.id,
      });
      continue; // no point checking expiry on wrong-type doc
    }

    // 2b. Expiry check
    if (doc.metadata.expiryDate) {
      if (isExpired(doc.metadata.expiryDate)) {
        const days = Math.abs(daysUntilExpiry(doc.metadata.expiryDate));
        results.push({
          id: `expired_${doc.slotId}`,
          category: 'expiry',
          status: 'fail',
          severity: 'critical',
          title: `Expired: ${slot.label}`,
          explanation: `This ${slot.label} expired ${days} day(s) ago and cannot be accepted for submission.`,
          evidence: `Expiry date: ${formatDate(doc.metadata.expiryDate)} | ${days} days past expiry`,
          recommendation: `Obtain a fresh ${slot.label} with a valid expiry date.`,
          relatedSlot: slot.id,
        });
      } else if (isNearExpiry(doc.metadata.expiryDate, 90)) {
        const days = daysUntilExpiry(doc.metadata.expiryDate);
        results.push({
          id: `near_expiry_${doc.slotId}`,
          category: 'near_expiry',
          status: 'warn',
          severity: 'warning',
          title: `Expiring Soon: ${slot.label}`,
          explanation: `This ${slot.label} will expire in ${days} day(s). Processing may take time, so it may be rejected before your application is reviewed.`,
          evidence: `Expiry date: ${formatDate(doc.metadata.expiryDate)} | ${days} days remaining`,
          recommendation: `Consider renewing the ${slot.label} before submission.`,
          relatedSlot: slot.id,
        });
      } else {
        results.push({
          id: `valid_expiry_${doc.slotId}`,
          category: 'expiry',
          status: 'pass',
          severity: 'info',
          title: `Valid: ${slot.label}`,
          explanation: `This ${slot.label} is current and has not expired.`,
          evidence: `Valid until: ${formatDate(doc.metadata.expiryDate)}`,
          recommendation: '',
          relatedSlot: slot.id,
        });
      }
    } else {
      results.push({
        id: `valid_${doc.slotId}`,
        category: 'expiry',
        status: 'pass',
        severity: 'info',
        title: `Valid: ${slot.label}`,
        explanation: `This ${slot.label} has been accepted (no expiry date required).`,
        evidence: `Issued: ${doc.metadata.issueDate ? formatDate(doc.metadata.issueDate) : 'Unknown'}`,
        recommendation: '',
        relatedSlot: slot.id,
      });
    }

    // 2c. Name consistency check
    if (doc.metadata.ownerName && app.fullName) {
      const match = namesMatch(app.fullName, doc.metadata.ownerName);
      if (!match) {
        results.push({
          id: `name_mismatch_${doc.slotId}`,
          category: 'consistency',
          status: 'fail',
          severity: 'critical',
          title: `Name Mismatch: ${slot.label}`,
          explanation: `The name on the ${slot.label} does not match the application. This may indicate different individuals, a typo, or abbreviation inconsistency.`,
          evidence: `Application: "${app.fullName}" | Document: "${doc.metadata.ownerName}"`,
          recommendation: `Ensure the name on all documents exactly matches your application name, or submit a name correction affidavit.`,
          relatedSlot: slot.id,
        });
      }
    }

    // 2d. Income certificate: consistency + eligibility from official document
    if (doc.metadata.documentType === 'income_certificate' && doc.metadata.income !== undefined) {
      const formIncome = parseFloat(String(app.annualIncome).replace(/,/g, ''));
      const docIncome = doc.metadata.income;

      if (!isNaN(formIncome)) {
        const diff = Math.abs(formIncome - docIncome);
        const tolerance = 10000; // ₹10,000 tolerance for rounding

        if (diff > tolerance) {
          results.push({
            id: 'income_conflict',
            category: 'consistency',
            status: 'fail',
            severity: 'critical',
            title: 'Income Conflict: Form vs Certificate',
            explanation: `The income in your form (${formatCurrency(formIncome)}) differs significantly from the income certificate (${formatCurrency(docIncome)}). Scholarship committees flag this as a red alert.`,
            evidence: `Form: ${formatCurrency(formIncome)} | Certificate: ${formatCurrency(docIncome)} | Difference: ${formatCurrency(diff)}`,
            recommendation: `The income certificate is the authoritative figure. Update your form to match, or obtain a corrected certificate.`,
            relatedSlot: 'income_certificate',
          });
        } else {
          results.push({
            id: 'income_consistent',
            category: 'consistency',
            status: 'pass',
            severity: 'info',
            title: 'Income: Form & Certificate Match',
            explanation: `Income declared in the form matches the income certificate.`,
            evidence: `Form: ${formatCurrency(formIncome)} | Certificate: ${formatCurrency(docIncome)}`,
            recommendation: '',
            relatedSlot: 'income_certificate',
          });
        }
      }

      // Certificate income exceeds limit (the authoritative figure)
      if (docIncome > SCHOLARSHIP_REQUIREMENTS.maxIncome) {
        results.push({
          id: 'cert_income_exceeded',
          category: 'eligibility',
          status: 'fail',
          severity: 'critical',
          title: 'Certificate Income Exceeds Eligibility Limit',
          explanation: `The income stated in the official income certificate (${formatCurrency(docIncome)}) exceeds the maximum allowed limit of ${formatCurrency(SCHOLARSHIP_REQUIREMENTS.maxIncome)}. This is the authoritative figure for eligibility.`,
          evidence: `Certificate income: ${formatCurrency(docIncome)} | Limit: ≤ ${formatCurrency(SCHOLARSHIP_REQUIREMENTS.maxIncome)}`,
          recommendation: `Your application will be rejected on income grounds. Verify your actual income qualifies for this scholarship.`,
          relatedSlot: 'income_certificate',
        });
      }
    }

    // 2e. Marksheet: CGPA consistency
    if (doc.metadata.documentType === 'academic_marksheet' && doc.metadata.cgpa && app.cgpa) {
      const formCgpa = parseFloat(app.cgpa);
      const docCgpa = parseFloat(doc.metadata.cgpa);
      if (!isNaN(formCgpa) && !isNaN(docCgpa)) {
        if (Math.abs(formCgpa - docCgpa) > 0.1) {
          results.push({
            id: 'cgpa_conflict',
            category: 'consistency',
            status: 'fail',
            severity: 'critical',
            title: 'CGPA Conflict: Form vs Marksheet',
            explanation: `The CGPA in your form (${formCgpa}) differs from the marksheet (${docCgpa}).`,
            evidence: `Form CGPA: ${formCgpa} | Marksheet CGPA: ${docCgpa}`,
            recommendation: `Update the CGPA in your form to match the marksheet exactly.`,
            relatedSlot: 'marksheet',
          });
        } else {
          results.push({
            id: 'cgpa_consistent',
            category: 'consistency',
            status: 'pass',
            severity: 'info',
            title: 'CGPA: Form & Marksheet Match',
            explanation: `CGPA declared in the form matches the academic marksheet.`,
            evidence: `Form CGPA: ${formCgpa} | Marksheet CGPA: ${docCgpa}`,
            recommendation: '',
            relatedSlot: 'marksheet',
          });
        }
      }
    }
  }

  // 3. Duplicate document check (same metadata ID uploaded to multiple slots)
  const metaIds = documents.map(d => d.metadata.id);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of metaIds) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    results.push({
      id: 'duplicate_docs',
      category: 'duplicate',
      status: 'fail',
      severity: 'warning',
      title: 'Duplicate Documents Detected',
      explanation: 'The same document appears to have been uploaded in multiple slots.',
      evidence: `Duplicate document IDs: ${[...dupes].join(', ')}`,
      recommendation: 'Remove duplicate documents and upload the correct document in each slot.',
    });
  }
}

// ============================================================
// Score & Risk calculation
// ============================================================

function calculateScore(results: VerificationResult[]): number {
  const fails = results.filter(r => r.status === 'fail');
  const warns = results.filter(r => r.status === 'warn');
  if (fails.length === 0 && warns.length === 0) return 100;

  let deduction = 0;
  for (const r of fails) {
    deduction += r.severity === 'critical' ? 20 : 10;
  }
  deduction += warns.length * 5;
  return Math.max(0, Math.min(100, 100 - deduction));
}

function calculateRisk(score: number): RiskLevel {
  if (score >= 90) return 'low';
  if (score >= 60) return 'medium';
  return 'high';
}

// ============================================================
// Action plan generation
// ============================================================

function buildActionPlan(results: VerificationResult[]): ActionItem[] {
  const issues = results.filter(r => r.status === 'fail' || r.status === 'warn');
  const actions: ActionItem[] = [];

  for (const issue of issues) {
    if (!issue.recommendation) continue;
    const priority =
      issue.severity === 'critical' ? 'urgent' :
      issue.severity === 'warning' ? 'high' : 'medium';

    actions.push({ priority, text: issue.recommendation, relatedSlot: issue.relatedSlot });
  }

  // Deduplicate
  const seen = new Set<string>();
  return actions.filter(a => {
    if (seen.has(a.text)) return false;
    seen.add(a.text);
    return true;
  });
}

// ============================================================
// Main verify function
// ============================================================

export function verify(
  app: ScholarshipApplication,
  documents: UploadedDocument[]
): VerificationReport {
  const results: VerificationResult[] = [];

  checkFields(app, results);
  checkDocuments(app, documents, results);

  const score = calculateScore(results);
  const riskLevel = calculateRisk(score);
  const actionPlan = buildActionPlan(results);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  return {
    score,
    riskLevel,
    isReady: failCount === 0,
    results,
    actionPlan,
    passCount,
    failCount,
    warnCount,
    analyzedAt: new Date(),
  };
}

// ============================================================
// Helpers (exported for use in components)
// ============================================================

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
