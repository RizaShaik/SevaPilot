// ============================================================
// ProofPilot — Data: Requirements & Demo Scenarios
// Demo scenarios are NEVER auto-loaded; user must click "Load Demo"
// ============================================================

import type {
  ScholarshipApplication,
  UploadedDocument,
  DemoScenario,
  ScholarshipRequirements,
} from './types';

// ============================================================
// Scholarship Requirements Definition
// ============================================================

export const SCHOLARSHIP_REQUIREMENTS: ScholarshipRequirements = {
  minCGPA: 7.5,
  maxIncome: 500000,
  requiredDocuments: [
    {
      id: 'marksheet',
      label: 'Academic Marksheet',
      icon: '📄',
      allowedTypes: ['academic_marksheet'],
      required: true,
      description: 'Latest semester/year marksheet showing CGPA/percentage',
    },
    {
      id: 'income_certificate',
      label: 'Income Certificate',
      icon: '📋',
      allowedTypes: ['income_certificate'],
      required: true,
      description: 'Family income certificate from Tehsildar or authorized officer',
    },
    {
      id: 'bonafide',
      label: 'Bonafide Certificate',
      icon: '🏫',
      allowedTypes: ['bonafide_certificate'],
      required: true,
      description: 'Current year bonafide certificate from your institution',
    },
    {
      id: 'bank_proof',
      label: 'Bank Proof',
      icon: '🏦',
      allowedTypes: ['bank_passbook', 'cancelled_cheque'],
      required: true,
      description: 'Bank passbook copy or cancelled cheque',
    },
  ],
};

// ============================================================
// Demo Scenarios (metadata only — no auto-loading)
// ============================================================

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'ready',
    label: '✅ Ready Application',
    sub: '100% ready — all docs valid',
    indicator: 'green',
    description: 'All documents valid, form complete, income within limit',
  },
  {
    id: 'missing_doc',
    label: '⚠️ Missing Document',
    sub: 'Bank proof not uploaded',
    indicator: 'yellow',
    description: 'All other docs valid but bank proof is missing',
  },
  {
    id: 'wrong_expired',
    label: '❌ Wrong / Expired Docs',
    sub: 'Fee receipt + expired certificate',
    indicator: 'red',
    description: 'Fee receipt uploaded instead of income certificate; expired bonafide',
  },
  {
    id: 'inconsistent',
    label: '🔀 Inconsistent Info',
    sub: 'Name mismatch + income conflict',
    indicator: 'orange',
    description: 'Name abbreviation on certificate; income on certificate differs from form',
  },
];

// ============================================================
// Demo Scenario Data (used ONLY when user explicitly loads them)
// ============================================================

export const DEMO_DATA: Record<string, {
  application: ScholarshipApplication;
  documents: UploadedDocument[];
}> = {
  ready: {
    application: {
      fullName: 'Riza Mukhaddam Khaji',
      dob: '2003-07-14',
      gender: 'Female',
      email: 'riza.khaji@example.com',
      phone: '9876543210',
      aadhaar: '123456789012',
      institution: 'Delhi Institute of Technology',
      course: 'B.Tech Computer Science',
      year: '2nd Year',
      cgpa: '8.4',
      rollNumber: 'DIT/CS/2024/0042',
      annualIncome: '320000',
      parentName: 'Mohammed Khaji',
      bankName: 'State Bank of India',
      accountNumber: '30012345678',
      ifsc: 'SBIN0001234',
    },
    documents: [
      {
        slotId: 'marksheet',
        file: { name: 'sem3_marksheet.pdf', size: 204800, type: 'application/pdf' },
        metadata: {
          id: 'demo-001',
          documentType: 'academic_marksheet',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-01-15',
          cgpa: '8.4',
          issuingAuthority: 'Delhi Institute of Technology',
          additionalData: { semester: '3', year: '2nd' },
          extractedByAI: false,
        },
      },
      {
        slotId: 'income_certificate',
        file: { name: 'income_certificate.pdf', size: 153600, type: 'application/pdf' },
        metadata: {
          id: 'demo-002',
          documentType: 'income_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-08-10',
          expiryDate: '2027-08-09',
          income: 320000,
          issuingAuthority: 'Tehsildar, Delhi',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bonafide',
        file: { name: 'bonafide_dit.pdf', size: 102400, type: 'application/pdf' },
        metadata: {
          id: 'demo-003',
          documentType: 'bonafide_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-07-20',
          expiryDate: '2027-06-30',
          issuingAuthority: 'Delhi Institute of Technology',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bank_proof',
        file: { name: 'sbi_passbook.pdf', size: 92160, type: 'application/pdf' },
        metadata: {
          id: 'demo-004',
          documentType: 'bank_passbook',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-09-01',
          issuingAuthority: 'State Bank of India',
          additionalData: { accountNumber: '30012345678', ifsc: 'SBIN0001234' },
          extractedByAI: false,
        },
      },
    ],
  },

  missing_doc: {
    application: {
      fullName: 'Riza Mukhaddam Khaji',
      dob: '2003-07-14',
      gender: 'Female',
      email: 'riza.khaji@example.com',
      phone: '9876543210',
      aadhaar: '123456789012',
      institution: 'Delhi Institute of Technology',
      course: 'B.Tech Computer Science',
      year: '2nd Year',
      cgpa: '8.4',
      rollNumber: 'DIT/CS/2024/0042',
      annualIncome: '320000',
      parentName: 'Mohammed Khaji',
      bankName: 'State Bank of India',
      accountNumber: '30012345678',
      ifsc: 'SBIN0001234',
    },
    documents: [
      {
        slotId: 'marksheet',
        file: { name: 'sem3_marksheet.pdf', size: 204800, type: 'application/pdf' },
        metadata: {
          id: 'demo-101',
          documentType: 'academic_marksheet',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-01-15',
          cgpa: '8.4',
          issuingAuthority: 'Delhi Institute of Technology',
          extractedByAI: false,
        },
      },
      {
        slotId: 'income_certificate',
        file: { name: 'income_certificate.pdf', size: 153600, type: 'application/pdf' },
        metadata: {
          id: 'demo-102',
          documentType: 'income_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-08-10',
          expiryDate: '2027-08-09',
          income: 320000,
          issuingAuthority: 'Tehsildar, Delhi',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bonafide',
        file: { name: 'bonafide_dit.pdf', size: 102400, type: 'application/pdf' },
        metadata: {
          id: 'demo-103',
          documentType: 'bonafide_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-07-20',
          expiryDate: '2027-06-30',
          issuingAuthority: 'Delhi Institute of Technology',
          extractedByAI: false,
        },
      },
      // bank_proof intentionally omitted
    ],
  },

  wrong_expired: {
    application: {
      fullName: 'Riza Mukhaddam Khaji',
      dob: '2003-07-14',
      gender: 'Female',
      email: 'riza.khaji@example.com',
      phone: '9876543210',
      aadhaar: '123456789012',
      institution: 'Delhi Institute of Technology',
      course: 'B.Tech Computer Science',
      year: '2nd Year',
      cgpa: '8.4',
      rollNumber: 'DIT/CS/2024/0042',
      annualIncome: '320000',
      parentName: 'Mohammed Khaji',
      bankName: 'State Bank of India',
      accountNumber: '30012345678',
      ifsc: 'SBIN0001234',
    },
    documents: [
      {
        slotId: 'marksheet',
        file: { name: 'sem3_marksheet.pdf', size: 204800, type: 'application/pdf' },
        metadata: {
          id: 'demo-201',
          documentType: 'academic_marksheet',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-01-15',
          cgpa: '8.4',
          extractedByAI: false,
        },
      },
      {
        // Income slot filled with a fee receipt (WRONG TYPE)
        slotId: 'income_certificate',
        file: { name: 'fee_receipt_2024.pdf', size: 88320, type: 'application/pdf' },
        metadata: {
          id: 'demo-202',
          documentType: 'fee_receipt',   // ← AI detected this as fee receipt, NOT income cert
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2024-09-01',
          additionalData: { amount: '45000', semester: '1' },
          extractedByAI: false,
        },
      },
      {
        // Bonafide is expired
        slotId: 'bonafide',
        file: { name: 'bonafide_old.pdf', size: 102400, type: 'application/pdf' },
        metadata: {
          id: 'demo-203',
          documentType: 'bonafide_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2024-07-01',
          expiryDate: '2025-06-30',       // ← EXPIRED
          issuingAuthority: 'Delhi Institute of Technology',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bank_proof',
        file: { name: 'sbi_passbook.pdf', size: 92160, type: 'application/pdf' },
        metadata: {
          id: 'demo-204',
          documentType: 'bank_passbook',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-09-01',
          extractedByAI: false,
        },
      },
    ],
  },

  inconsistent: {
    application: {
      fullName: 'Riza Mukhaddam Khaji',  // Full name in form
      dob: '2003-07-14',
      gender: 'Female',
      email: 'riza.khaji@example.com',
      phone: '9876543210',
      aadhaar: '123456789012',
      institution: 'Delhi Institute of Technology',
      course: 'B.Tech Computer Science',
      year: '2nd Year',
      cgpa: '8.4',
      rollNumber: 'DIT/CS/2024/0042',
      annualIncome: '320000',           // Form says ₹3.2L
      parentName: 'Mohammed Khaji',
      bankName: 'State Bank of India',
      accountNumber: '30012345678',
      ifsc: 'SBIN0001234',
    },
    documents: [
      {
        slotId: 'marksheet',
        file: { name: 'sem3_marksheet.pdf', size: 204800, type: 'application/pdf' },
        metadata: {
          id: 'demo-301',
          documentType: 'academic_marksheet',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-01-15',
          cgpa: '8.4',
          extractedByAI: false,
        },
      },
      {
        // Income certificate has DIFFERENT name AND higher income
        slotId: 'income_certificate',
        file: { name: 'income_cert_2026.pdf', size: 153600, type: 'application/pdf' },
        metadata: {
          id: 'demo-302',
          documentType: 'income_certificate',
          ownerName: 'Riza M. Khaji',        // ← NAME MISMATCH (abbreviated middle name)
          issueDate: '2026-08-10',
          expiryDate: '2027-08-09',
          income: 580000,                     // ← INCOME CONFLICT + exceeds ₹5L limit
          issuingAuthority: 'Tehsildar, Delhi',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bonafide',
        file: { name: 'bonafide_dit.pdf', size: 102400, type: 'application/pdf' },
        metadata: {
          id: 'demo-303',
          documentType: 'bonafide_certificate',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-07-20',
          expiryDate: '2027-06-30',
          issuingAuthority: 'Delhi Institute of Technology',
          extractedByAI: false,
        },
      },
      {
        slotId: 'bank_proof',
        file: { name: 'sbi_passbook.pdf', size: 92160, type: 'application/pdf' },
        metadata: {
          id: 'demo-304',
          documentType: 'bank_passbook',
          ownerName: 'Riza Mukhaddam Khaji',
          issueDate: '2026-09-01',
          extractedByAI: false,
        },
      },
    ],
  },
};

// ============================================================
// Helper: format currency
// ============================================================
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ============================================================
// Helper: format file size
// ============================================================
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// Helper: days until expiry
// ============================================================
export function daysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const exp = new Date(expiryDate);
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// Helper: is expired
// ============================================================
export function isExpired(expiryDate: string): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

// ============================================================
// Helper: is near expiry (within 90 days)
// ============================================================
export function isNearExpiry(expiryDate: string, thresholdDays = 90): boolean {
  const days = daysUntilExpiry(expiryDate);
  return days >= 0 && days <= thresholdDays;
}

// ============================================================
// Name similarity (fuzzy match for consistency check)
// ============================================================
export function namesMatch(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  if (n1 === n2) return true;
  // Check if one is an abbreviated form of the other (word by word)
  const words1 = name1.toLowerCase().trim().split(/\s+/);
  const words2 = name2.toLowerCase().trim().split(/\s+/);
  if (words1.length !== words2.length) return false;
  for (let i = 0; i < words1.length; i++) {
    const w1 = words1[i];
    const w2 = words2[i];
    if (w1 === w2) continue;
    // Allow if one is an initial of the other
    if (w1.length === 1 || w2.length === 1) {
      if (w1[0] === w2[0]) continue;
    }
    return false;
  }
  return true;
}

// ============================================================
// Human-readable document type label
// ============================================================
export function formatDocType(type: string): string {
  const labels: Record<string, string> = {
    academic_marksheet: 'Academic Marksheet',
    income_certificate: 'Income Certificate',
    bonafide_certificate: 'Bonafide Certificate',
    bank_passbook: 'Bank Passbook',
    cancelled_cheque: 'Cancelled Cheque',
    fee_receipt: 'Fee Receipt',
    admit_card: 'Admit Card',
    id_card: 'ID Card',
    utility_bill: 'Utility Bill',
    driving_license: 'Driving License',
    passport: 'Passport',
    unknown: 'Unknown Document',
  };
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
