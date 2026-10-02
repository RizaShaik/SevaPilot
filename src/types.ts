// ============================================================
// ProofPilot — Core Types
// Evidence Intelligence Engine
// ============================================================

export type Severity = 'critical' | 'warning' | 'info';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';

export interface VerificationResult {
  id: string;
  category: 'eligibility' | 'completeness' | 'document_type' | 'expiry' | 'near_expiry' | 'consistency' | 'duplicate' | 'field';
  status: CheckStatus;
  severity: Severity;
  title: string;
  explanation: string;
  evidence: string;
  recommendation: string;
  relatedSlot?: string; // maps to requirement slot ID for Evidence Map
}

export interface ActionItem {
  priority: 'urgent' | 'high' | 'medium';
  text: string;
  relatedSlot?: string; // which document slot to fix
}

export interface VerificationReport {
  score: number;             // 0-100
  riskLevel: RiskLevel;
  isReady: boolean;
  results: VerificationResult[];
  actionPlan: ActionItem[];
  passCount: number;
  failCount: number;
  warnCount: number;
  analyzedAt: Date;
}

// ============================================================
// Document Types
// ============================================================

export type DocumentStatus =
  | 'verified'
  | 'wrong_document'
  | 'expired'
  | 'expiring_soon'
  | 'missing'
  | 'inconsistent'
  | 'eligibility_failure'
  | 'warning'
  | 'analyzing';

export interface DocumentMetadata {
  id: string;
  documentType: string;      // canonical type detected by AI (NOT the filename)
  ownerName: string;
  issueDate: string;         // ISO date
  expiryDate?: string;       // ISO date, optional
  income?: number;           // for income certificate
  cgpa?: string;             // for marksheet
  issuingAuthority?: string;
  institution?: string;
  validity?: string;         // human-readable validity
  additionalData?: Record<string, string | number>;
  extractedByAI: boolean;    // was this extracted by Gemini, or is it a fallback/demo?
}

export interface UploadedDocument {
  slotId: string;            // which slot this was uploaded to
  file: {
    name: string;
    size: number;
    type: string;
  };
  metadata: DocumentMetadata;
}

// ============================================================
// Application Types
// ============================================================

export interface ScholarshipApplication {
  // Personal
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  aadhaar: string;

  // Academic
  institution: string;
  course: string;
  year: string;
  cgpa: string;
  rollNumber: string;

  // Family
  annualIncome: string;
  parentName: string;

  // Bank
  bankName: string;
  accountNumber: string;
  ifsc: string;
}

export const EMPTY_APPLICATION: ScholarshipApplication = {
  fullName: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  aadhaar: '',
  institution: '',
  course: '',
  year: '',
  cgpa: '',
  rollNumber: '',
  annualIncome: '',
  parentName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
};

// ============================================================
// Scholarship Requirements
// ============================================================

export interface ScholarshipRequirements {
  minCGPA: number;
  maxIncome: number;    // annual family income in INR
  requiredDocuments: RequiredDocumentSlot[];
}

export interface RequiredDocumentSlot {
  id: string;
  label: string;
  icon: string;
  allowedTypes: string[];
  required: boolean;
  description: string;
}

// ============================================================
// Evidence Map Node
// ============================================================

export type EvidenceNodeStatus = 'verified' | 'issue' | 'missing' | 'warning';

export interface EvidenceMapNode {
  requirementId: string;
  requirementLabel: string;
  requirementIcon: string;
  status: EvidenceNodeStatus;
  documentName?: string;
  detectedType?: string;    // what Gemini/AI said the document IS
  expectedType?: string;    // what the slot requires
  extractedFacts?: Record<string, string>; // income, cgpa, name, dates etc.
  issues: VerificationResult[];
  passes: VerificationResult[];
}

// ============================================================
// Demo Scenario
// ============================================================

export type DemoScenarioId = 'ready' | 'missing_doc' | 'wrong_expired' | 'inconsistent';

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  sub: string;
  indicator: 'green' | 'yellow' | 'red' | 'orange';
  description: string;
}

// ============================================================
// App State
// ============================================================

export type AppStep = 'landing' | 'select' | 'form' | 'analyzing' | 'dashboard';
export type DashboardTab = 'overview' | 'evidence_map';
