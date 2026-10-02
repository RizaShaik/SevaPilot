import React, { useState, useRef } from 'react';
import type { ScholarshipApplication, UploadedDocument, DemoScenarioId } from '../types';
import { SCHOLARSHIP_REQUIREMENTS, DEMO_SCENARIOS, DEMO_DATA, formatFileSize } from '../data';

// ============================================================
// Validators
// All format validation is generic — no hardcoded examples determine pass/fail
// ============================================================

function validateField(key: keyof ScholarshipApplication, value: string): string | undefined {
  const v = (value ?? '').trim();

  // Fields that are always required
  const REQUIRED: (keyof ScholarshipApplication)[] = [
    'fullName', 'dob', 'gender', 'email', 'phone', 'aadhaar',
    'institution', 'course', 'year', 'rollNumber', 'parentName',
    'annualIncome', 'cgpa', 'bankName', 'accountNumber', 'ifsc',
  ];

  if (REQUIRED.includes(key) && !v) {
    return 'This field is required';
  }

  switch (key) {
    case 'fullName':
      if (v && v.length < 2) return 'Enter your full name';
      break;

    case 'dob': {
      if (!v) break;
      const d = new Date(v);
      if (isNaN(d.getTime())) return 'Enter a valid date of birth';
      const age = new Date().getFullYear() - d.getFullYear();
      if (age < 14 || age > 60) return 'Date of birth seems incorrect';
      break;
    }

    case 'email':
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
      break;

    case 'phone': {
      const digits = v.replace(/\D/g, '');
      if (v && digits.length !== 10) return 'Phone number must be exactly 10 digits';
      break;
    }

    case 'aadhaar': {
      const digits = v.replace(/\D/g, '');
      if (v && digits.length !== 12) return 'Aadhaar must be exactly 12 digits';
      break;
    }

    case 'accountNumber': {
      const digits = v.replace(/\D/g, '');
      if (v && (digits.length < 9 || digits.length > 18)) return 'Bank account number must be 9–18 digits';
      break;
    }

    case 'ifsc': {
      // Generic IFSC format: 4 letters, 0, 6 alphanumeric. No specific bank hardcoded.
      const normalized = v.toUpperCase();
      if (v && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalized)) {
        return 'Invalid IFSC format — 11 characters: 4 letters + 0 + 6 alphanumeric (e.g. ABCD0123456)';
      }
      break;
    }

    case 'cgpa': {
      const n = parseFloat(v);
      if (v && (isNaN(n) || n < 0 || n > 10)) return 'CGPA must be a number between 0 and 10';
      break;
    }

    case 'annualIncome': {
      const n = parseFloat(v.replace(/,/g, ''));
      if (v && (isNaN(n) || n < 0)) return 'Enter a valid positive income amount';
      break;
    }
  }

  return undefined;
}

// ============================================================
// Masking helpers
// ============================================================

function maskAadhaar(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 4) return raw;
  return '•'.repeat(d.length - 4) + d.slice(-4);
}

function maskAccount(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 4) return raw;
  return '•'.repeat(d.length - 4) + d.slice(-4);
}

// ============================================================
// Props
// ============================================================

interface ScholarshipFormProps {
  application: ScholarshipApplication;
  documents: UploadedDocument[];
  onAppChange: (app: ScholarshipApplication) => void;
  onDocumentsChange: (docs: UploadedDocument[]) => void;
  onLoadDemo: (app: ScholarshipApplication, docs: UploadedDocument[]) => void;
  onSubmit: () => void;
  onBack: () => void;
}

// ============================================================
// Component
// ============================================================

const ScholarshipForm: React.FC<ScholarshipFormProps> = ({
  application,
  documents,
  onAppChange,
  onDocumentsChange,
  onLoadDemo,
  onSubmit,
  onBack,
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof ScholarshipApplication, string>>>({});
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [maskedFields, setMaskedFields] = useState<Record<string, boolean>>({
    aadhaar: true,
    accountNumber: true,
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Field change handler ───────────────────────────────────
  const handleChange = (key: keyof ScholarshipApplication) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Auto-normalize IFSC to uppercase
    const val = key === 'ifsc' ? e.target.value.toUpperCase() : e.target.value;
    onAppChange({ ...application, [key]: val });
    const err = validateField(key, val);
    setErrors(prev => ({ ...prev, [key]: err }));
  };

  const handleBlur = (key: keyof ScholarshipApplication) => (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const err = validateField(key, e.target.value);
    setErrors(prev => ({ ...prev, [key]: err }));
  };

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof ScholarshipApplication, string>> = {};
    let isValid = true;
    (Object.keys(application) as Array<keyof ScholarshipApplication>).forEach(key => {
      const err = validateField(key, application[key]);
      if (err) {
        newErrors[key] = err;
        isValid = false;
      }
    });
    setErrors(newErrors);
    if (!isValid) {
      // Scroll to first error
      const firstErrorEl = document.querySelector('.is-invalid');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return isValid;
  };

  const handleSubmit = () => {
    if (validateAll()) {
      onSubmit();
    }
  };

  // ── Document upload ────────────────────────────────────────
  const getDocForSlot = (slotId: string) => documents.find(d => d.slotId === slotId);

  const handleFileUpload = async (slotId: string, file: File) => {
    setUploadingSlots(prev => ({ ...prev, [slotId]: true }));
    setUploadErrors(prev => ({ ...prev, [slotId]: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slotId', slotId);

      const res = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });

      const body = await res.json().catch(() => ({ error: res.statusText }));

      // 429 = quota exhausted — surface a clear message, do NOT retry
      if (res.status === 429 || body._quotaExhausted) {
        setUploadErrors(prev => ({
          ...prev,
          [slotId]: '⛔ Gemini quota exceeded. Results will show "unknown" type. Wait for quota reset or configure a different API key.',
        }));
        // Still record the file so the user sees something (will be flagged as wrong type by verifier)
        const fallbackDoc: UploadedDocument = {
          slotId,
          file: { name: file.name, size: file.size, type: file.type },
          metadata: {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            documentType: 'unknown',
            ownerName: '',
            issueDate: new Date().toISOString().split('T')[0],
            extractedByAI: false,
          },
        };
        onDocumentsChange([...documents.filter(d => d.slotId !== slotId), fallbackDoc]);
        return;
      }

      if (!res.ok) {
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const newDoc: UploadedDocument = {
        slotId,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
        metadata: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          documentType: body.documentType || 'unknown',
          ownerName: body.ownerName || '',
          issueDate: body.issueDate || new Date().toISOString().split('T')[0],
          expiryDate: body.expiryDate || undefined,
          income: body.income ?? undefined,
          cgpa: body.cgpa ?? undefined,
          issuingAuthority: body.issuingAuthority || undefined,
          institution: body.institution || undefined,
          additionalData: body.additionalData || undefined,
          extractedByAI: body._extractedByAI === true,
        },
      };

      // Replace existing doc in this slot, or add new
      const updated = [...documents.filter(d => d.slotId !== slotId), newDoc];
      onDocumentsChange(updated);
    } catch (err: any) {
      console.error('[ScholarshipForm] Upload/analyze failed:', err);
      setUploadErrors(prev => ({
        ...prev,
        [slotId]: err.message || 'Failed to analyze document. Please try again.',
      }));
    } finally {
      setUploadingSlots(prev => ({ ...prev, [slotId]: false }));
    }
  };


  const triggerFileInput = (slotId: string) => {
    fileInputRefs.current[slotId]?.click();
  };

  const handleFileChange = (slotId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(slotId, file);
    }
    e.target.value = '';
  };

  const removeDocument = (slotId: string) => {
    onDocumentsChange(documents.filter(d => d.slotId !== slotId));
    setUploadErrors(prev => ({ ...prev, [slotId]: '' }));
  };

  // ── Demo scenario loading ──────────────────────────────────
  const loadDemoScenario = (id: DemoScenarioId) => {
    const data = DEMO_DATA[id];
    if (data) {
      onLoadDemo(data.application, data.documents);
      setErrors({});
      setUploadErrors({});
      setShowDemoPanel(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────

  const renderField = (
    key: keyof ScholarshipApplication,
    label: string,
    placeholder: string,
    type = 'text',
    hint?: string,
  ) => {
    const isMaskable = key === 'aadhaar' || key === 'accountNumber';
    const isMasked = maskedFields[key] ?? false;

    let displayValue = application[key] as string;
    if (isMasked && displayValue) {
      if (key === 'aadhaar') displayValue = maskAadhaar(displayValue);
      if (key === 'accountNumber') displayValue = maskAccount(displayValue);
    }

    return (
      <div className="form-group">
        <label className="form-label" htmlFor={`form-${key}`}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            id={`form-${key}`}
            className={`form-input ${errors[key] ? 'is-invalid' : ''}`}
            type={isMasked ? 'password' : type}
            value={isMasked ? '' : (application[key] as string)}
            placeholder={isMasked && application[key] ? displayValue : placeholder}
            onChange={handleChange(key)}
            onBlur={handleBlur(key)}
            autoComplete={key === 'aadhaar' ? 'off' : undefined}
          />
          {isMaskable && (
            <button
              type="button"
              onClick={() => setMaskedFields(prev => ({ ...prev, [key]: !isMasked }))}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 4px',
              }}
              title={isMasked ? 'Show' : 'Hide'}
            >
              {isMasked ? '👁' : '🙈'}
            </button>
          )}
        </div>
        {errors[key] && (
          <span className="form-error">{errors[key]}</span>
        )}
        {!errors[key] && hint && (
          <span className="form-hint">{hint}</span>
        )}
      </div>
    );
  };

  const renderSelect = (
    key: keyof ScholarshipApplication,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`form-${key}`}>{label}</label>
      <select
        id={`form-${key}`}
        className={`form-input form-select ${errors[key] ? 'is-invalid' : ''}`}
        value={application[key] as string}
        onChange={handleChange(key)}
        onBlur={handleBlur(key)}
      >
        <option value="">Select {label.replace(' *', '').toLowerCase()}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errors[key] && <span className="form-error">{errors[key]}</span>}
    </div>
  );

  // ── Complete count ─────────────────────────────────────────
  const uploadedCount = SCHOLARSHIP_REQUIREMENTS.requiredDocuments.filter(
    slot => documents.some(d => d.slotId === slot.id)
  ).length;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="scholarship-page page">

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Step 2 of 3 · Scholarship Application</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="page-title" style={{ marginBottom: 4 }}>
              🎓 Future Scholars Excellence Scholarship 2026
            </h2>
            <p className="page-subtitle">
              Issuer: National Education Trust · Deadline: 31 Oct 2026
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
            <button
              className="btn btn-secondary btn-sm"
              id="load-demo-btn"
              onClick={() => setShowDemoPanel(v => !v)}
            >
              🎭 Load Demo Scenario
            </button>
            <button className="btn btn-primary" id="verify-btn" onClick={handleSubmit}>
              🔍 Run ProofPilot Check →
            </button>
          </div>
        </div>
      </div>

      {/* Demo Scenario Panel */}
      {showDemoPanel && (
        <div className="demo-scenario-panel" style={{
          marginBottom: 20, padding: '16px 20px',
          background: 'rgba(108,142,255,0.06)',
          border: '1px solid rgba(108,142,255,0.2)',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎭 Load a Demo Scenario</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Replaces your current form data and documents. Used for testing the verification engine.
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDemoPanel(false)}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {DEMO_SCENARIOS.map(s => (
              <button
                key={s.id}
                id={`demo-${s.id}`}
                className="scenario-btn"
                onClick={() => loadDemoScenario(s.id)}
                style={{ textAlign: 'left' }}
              >
                <span className={`scenario-indicator ${s.indicator}`} />
                <div>
                  <span className="scenario-label">{s.label}</span>
                  <span className="scenario-sub">{s.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scholarship-layout">
        <div className="form-section">

          {/* ── Personal Information ── */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-icon">👤</div>
              <div className="section-card-title">Personal Information</div>
            </div>
            <div className="section-card-body">
              <div className="form-row">
                {renderField('fullName', 'Full Name *', 'As per Aadhaar / government ID')}
                {renderField('dob', 'Date of Birth *', '', 'date')}
              </div>
              <div className="form-row">
                {renderSelect('gender', 'Gender *', [
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Other', label: 'Other / Prefer not to say' },
                ])}
                {renderField('aadhaar', 'Aadhaar Number *', '12-digit Aadhaar number', 'text', 'Stored masked for privacy')}
              </div>
              <div className="form-row">
                {renderField('email', 'Email Address *', 'applicant@example.com', 'email')}
                {renderField('phone', 'Phone Number *', '10-digit mobile number')}
              </div>
            </div>
          </div>

          {/* ── Academic Details ── */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-icon">🎓</div>
              <div className="section-card-title">Academic Details</div>
            </div>
            <div className="section-card-body">
              <div className="form-row">
                {renderField('institution', 'Institution Name *', 'Full name of your college/university')}
                {renderField('course', 'Course *', 'e.g. B.Tech Computer Science')}
              </div>
              <div className="form-row">
                {renderSelect('year', 'Year of Study *', [
                  { value: '1st Year', label: '1st Year' },
                  { value: '2nd Year', label: '2nd Year' },
                  { value: '3rd Year', label: '3rd Year' },
                  { value: '4th Year', label: '4th Year' },
                  { value: '5th Year', label: '5th Year' },
                ])}
                {renderField('rollNumber', 'Roll Number *', 'Institutional roll number')}
              </div>
              <div className="form-row">
                {renderField('cgpa', 'CGPA (out of 10) *', 'e.g. 8.4', 'text', 'Minimum required: 7.5')}
                {renderField('annualIncome', 'Annual Family Income (₹) *', 'Amount in INR', 'text', 'Maximum allowed: ₹5,00,000')}
              </div>
              <div className="form-row">
                {renderField('parentName', 'Parent / Guardian Name *', 'Full name')}
              </div>
            </div>
          </div>

          {/* ── Bank Details ── */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-icon">🏦</div>
              <div className="section-card-title">Bank Details</div>
            </div>
            <div className="section-card-body">
              <div className="form-row">
                {renderField('bankName', 'Bank Name *', 'e.g. State Bank of India')}
                {renderField('accountNumber', 'Account Number *', '9–18 digit account number', 'text', 'Stored masked for privacy')}
              </div>
              <div style={{ maxWidth: 280 }}>
                {renderField('ifsc', 'IFSC Code *', 'ABCD0123456', 'text', 'Format: 4 letters + 0 + 6 alphanumeric')}
              </div>
            </div>
          </div>

          {/* ── Required Documents ── */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-icon">📎</div>
              <div className="section-card-title">Required Documents</div>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: uploadedCount === SCHOLARSHIP_REQUIREMENTS.requiredDocuments.length ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {uploadedCount} / {SCHOLARSHIP_REQUIREMENTS.requiredDocuments.length} uploaded
              </span>
            </div>
            <div className="section-card-body">
              {/* Privacy notice */}
              <div style={{
                padding: '10px 14px', marginBottom: 16,
                background: 'rgba(108,142,255,0.04)',
                border: '1px dashed rgba(108,142,255,0.2)',
                borderRadius: 8, fontSize: '0.76rem', color: 'var(--text-muted)',
              }}>
                🔍 Each document is analyzed by AI to detect its actual type and extract relevant information.
                Uploading a file named "income_certificate.pdf" does not guarantee it will be accepted —
                the <strong>contents</strong> of the document are verified.
              </div>

              {SCHOLARSHIP_REQUIREMENTS.requiredDocuments.map(slot => {
                const doc = getDocForSlot(slot.id);
                const isUploading = uploadingSlots[slot.id];
                const uploadError = uploadErrors[slot.id];

                return (
                  <div
                    key={slot.id}
                    className={`doc-slot ${doc ? 'uploaded' : ''}`}
                    id={`doc-slot-${slot.id}`}
                  >
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      ref={el => { fileInputRefs.current[slot.id] = el; }}
                      onChange={handleFileChange(slot.id)}
                    />

                    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 12 }}>
                      <div className="doc-slot-icon">{slot.icon}</div>
                      <div className="doc-slot-info" style={{ flex: 1 }}>
                        <div className="doc-slot-name">{slot.label}</div>

                        {isUploading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)' }}>
                              Analyzing with AI…
                            </span>
                          </div>
                        ) : doc ? (
                          <div style={{ marginTop: 4 }}>
                            <div className="doc-slot-meta">
                              📄 {doc.file.name} · {formatFileSize(doc.file.size)}
                            </div>
                            <div className="doc-slot-meta" style={{ marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: doc.metadata.extractedByAI ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                                color: doc.metadata.extractedByAI ? 'var(--success)' : '#fbbf24',
                                border: `1px solid ${doc.metadata.extractedByAI ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                              }}>
                                {doc.metadata.extractedByAI ? '🤖 AI' : '📋 Demo'} · Detected: {doc.metadata.documentType.replace(/_/g, ' ')}
                              </span>
                              {doc.metadata.ownerName && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  👤 {doc.metadata.ownerName}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="doc-slot-meta">{slot.description}</div>
                        )}

                        {uploadError && (
                          <div style={{
                            marginTop: 6, padding: '6px 10px',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            borderRadius: 6, fontSize: '0.75rem', color: 'var(--error)',
                          }}>
                            ⚠ {uploadError}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {isUploading ? null : doc ? (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              id={`remove-${slot.id}`}
                              onClick={() => removeDocument(slot.id)}
                            >
                              ✕ Remove
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              id={`replace-${slot.id}`}
                              onClick={() => triggerFileInput(slot.id)}
                            >
                              🔄 Replace
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            id={`upload-${slot.id}`}
                            onClick={() => triggerFileInput(slot.id)}
                          >
                            ↑ Upload
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onBack}>← Back</button>
            <button className="btn btn-primary" id="verify-bottom-btn" onClick={handleSubmit}>
              🔍 Run ProofPilot Check →
            </button>
          </div>
        </div>

        {/* Right Panel — Eligibility Criteria */}
        <div className="demo-panel">
          <div className="demo-panel-card">
            <div className="demo-panel-header">
              <span style={{ fontSize: '0.85rem' }}>📝</span>
              <span className="demo-panel-title">Eligibility Criteria</span>
            </div>
            <div className="requirements-list">
              <div className="req-item">
                <div className="req-icon" style={{ background: 'var(--brand-primary)' }} />
                <span className="req-text">Undergraduate student (any year)</span>
              </div>
              <div className="req-item">
                <div className="req-icon" style={{ background: 'var(--brand-primary)' }} />
                <span className="req-text">CGPA ≥ 7.5 (out of 10)</span>
              </div>
              <div className="req-item">
                <div className="req-icon" style={{ background: 'var(--brand-primary)' }} />
                <span className="req-text">Annual family income ≤ ₹5,00,000</span>
              </div>
              <div className="req-item">
                <div className="req-icon" style={{ background: 'var(--brand-primary)' }} />
                <span className="req-text">Indian citizen with Aadhaar</span>
              </div>
            </div>
          </div>

          <div className="demo-panel-card" style={{ marginTop: 12 }}>
            <div className="demo-panel-header">
              <span style={{ fontSize: '0.85rem' }}>📋</span>
              <span className="demo-panel-title">Required Documents</span>
            </div>
            <div className="requirements-list">
              {SCHOLARSHIP_REQUIREMENTS.requiredDocuments.map(slot => {
                const uploaded = documents.some(d => d.slotId === slot.id);
                return (
                  <div key={slot.id} className="req-item">
                    <div className="req-icon" style={{ background: uploaded ? 'var(--success)' : 'var(--text-muted)' }} />
                    <span className="req-text" style={{ color: uploaded ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {slot.icon} {slot.label}
                      {uploaded && <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="demo-panel-card" style={{ marginTop: 12, background: 'rgba(108,142,255,0.03)', border: '1px dashed rgba(108,142,255,0.15)' }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                🔒 Privacy Note
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Aadhaar and bank account numbers are displayed masked. Documents are analyzed in-memory and are not permanently stored.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipForm;
