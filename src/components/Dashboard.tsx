import React, { useState, useRef } from 'react';
import type {
  VerificationReport,
  VerificationResult,
  UploadedDocument,
  DashboardTab,
  ScholarshipApplication,
} from '../types';
import { SCHOLARSHIP_REQUIREMENTS, formatFileSize } from '../data';
import ScoreRing from './ScoreRing';
import AIChat from './AIChat';
import EvidenceMap from './EvidenceMap';

interface DashboardProps {
  report: VerificationReport;
  application: ScholarshipApplication;
  documents: UploadedDocument[];
  onDocumentsChange: (docs: UploadedDocument[]) => void;
  onAppChange: (app: ScholarshipApplication) => void;
  onRecheck: () => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  eligibility: '⚡ Eligibility',
  completeness: '📋 Document Completeness',
  document_type: '🏷️ Document Types',
  expiry: '📅 Expiry & Validity',
  near_expiry: '⏰ Near Expiry',
  consistency: '🔀 Data Consistency',
  duplicate: '🔁 Duplicates',
  field: '📝 Required Fields',
};

function groupByCategory(results: VerificationResult[]) {
  const groups: Record<string, VerificationResult[]> = {};
  for (const r of results) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  return groups;
}

function getCategoryStatus(items: VerificationResult[]) {
  if (items.some(i => i.status === 'fail')) return 'fail';
  if (items.some(i => i.status === 'warn')) return 'warn';
  return 'pass';
}

const CheckItemRow: React.FC<{ item: VerificationResult }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const iconMap = { pass: '✓', fail: '✕', warn: '⚠', skip: '—' };
  const colorMap = { pass: 'pass', fail: 'fail', warn: 'warn', skip: 'info' };

  return (
    <div
      className={`check-item ${item.status !== 'pass' ? 'clickable' : ''}`}
      style={{ cursor: item.status !== 'pass' ? 'pointer' : 'default' }}
      onClick={() => item.status !== 'pass' && setExpanded(e => !e)}
    >
      <div className={`check-item-icon ${colorMap[item.status]}`}>
        {iconMap[item.status]}
      </div>
      <div className="check-item-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div className="check-item-title">{item.title}</div>
          {item.status !== 'pass' && (
            <span className={`check-item-severity ${item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info'}`}>
              {item.severity}
            </span>
          )}
        </div>
        <div className="check-item-desc">{item.explanation}</div>
        {item.evidence && (
          <div className="check-item-evidence">{item.evidence}</div>
        )}
        {expanded && item.recommendation && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'rgba(108,142,255,0.06)',
            border: '1px solid rgba(108,142,255,0.18)',
            borderRadius: 8, fontSize: '0.8rem',
            color: 'var(--brand-primary)', fontWeight: 500,
          }}>
            💡 {item.recommendation}
          </div>
        )}
        {item.status !== 'pass' && item.recommendation && (
          <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {expanded ? '▲ Show less' : '▼ Click for fix recommendation'}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Real Upload Panel ──────────────────────────────────────────────────────────
// Allows user to upload/replace documents directly from dashboard
// ──────────────────────────────────────────────────────────────────────────────

interface UploadPanelProps {
  documents: UploadedDocument[];
  onDocumentsChange: (docs: UploadedDocument[]) => void;
  onClose: () => void;
  onRecheck: () => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ documents, onDocumentsChange, onClose, onRecheck }) => {
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

      // 429 = quota exhausted — do NOT retry
      if (res.status === 429 || body._quotaExhausted) {
        setUploadErrors(prev => ({
          ...prev,
          [slotId]: '⛔ Gemini quota exceeded. Type will show as unknown. Wait for quota reset.',
        }));
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
        file: { name: file.name, size: file.size, type: file.type },
        metadata: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          documentType: body.documentType || 'unknown',
          ownerName: body.ownerName || '',
          issueDate: body.issueDate || new Date().toISOString().split('T')[0],
          expiryDate: body.expiryDate || undefined,
          income: body.income ?? undefined,
          cgpa: body.cgpa ?? undefined,
          issuingAuthority: body.issuingAuthority || undefined,
          extractedByAI: body._extractedByAI === true,
        },
      };

      const updated = [...documents.filter(d => d.slotId !== slotId), newDoc];
      onDocumentsChange(updated);
    } catch (err: any) {
      console.error('[UploadPanel] Upload/analyze failed:', err);
      setUploadErrors(prev => ({ ...prev, [slotId]: err.message || 'Upload failed. Try again.' }));
    } finally {
      setUploadingSlots(prev => ({ ...prev, [slotId]: false }));
    }
  };


  const triggerFileInput = (slotId: string) => fileInputRefs.current[slotId]?.click();

  const handleFileChange = (slotId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(slotId, file);
    e.target.value = '';
  };

  const removeDocument = (slotId: string) => {
    onDocumentsChange(documents.filter(d => d.slotId !== slotId));
  };

  return (
    <div className="fix-panel">
      <div className="fix-panel-header">
        <div>
          <div className="fix-panel-title">📤 Upload Corrected Documents</div>
          <div className="fix-panel-subtitle">
            Upload the correct documents, then run ProofPilot Check again to update your results.
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
      </div>

      <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCHOLARSHIP_REQUIREMENTS.requiredDocuments.map(slot => {
          const doc = getDocForSlot(slot.id);
          const isUploading = uploadingSlots[slot.id];
          const uploadError = uploadErrors[slot.id];

          return (
            <div
              key={slot.id}
              className={`doc-slot ${doc ? 'uploaded' : ''}`}
              style={{ padding: '12px 16px' }}
            >
              <input
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                ref={el => { fileInputRefs.current[slot.id] = el; }}
                onChange={handleFileChange(slot.id)}
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: '1.4rem' }}>{slot.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{slot.label}</div>
                  {isUploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="loading-spinner" style={{ width: 12, height: 12 }} />
                      <span style={{ fontSize: '0.76rem', color: 'var(--brand-primary)' }}>Analyzing…</span>
                    </div>
                  ) : doc ? (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {doc.file.name} · {formatFileSize(doc.file.size)}
                      </div>
                      <div style={{ fontSize: '0.7rem', marginTop: 2, color: 'var(--text-muted)' }}>
                        Detected: <strong>{doc.metadata.documentType.replace(/_/g, ' ')}</strong>
                        {doc.metadata.ownerName && ` · ${doc.metadata.ownerName}`}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>Not uploaded</div>
                  )}
                  {uploadError && (
                    <div style={{ marginTop: 4, fontSize: '0.73rem', color: 'var(--error)' }}>⚠ {uploadError}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isUploading && doc ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeDocument(slot.id)}>✕</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => triggerFileInput(slot.id)}>🔄</button>
                    </>
                  ) : !isUploading ? (
                    <button className="btn btn-primary btn-sm" onClick={() => triggerFileInput(slot.id)}>↑ Upload</button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fix-panel-footer">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          After updating documents, click "Run ProofPilot Check" to re-verify.
        </div>
        <button className="btn btn-primary" id="run-recheck-btn" onClick={() => { onClose(); onRecheck(); }}>
          🔍 Run ProofPilot Check →
        </button>
      </div>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({
  report,
  application,
  documents,
  onDocumentsChange,
  onRecheck,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const groups = groupByCategory(report.results);
  const issues = report.results.filter(r => r.status === 'fail' || r.status === 'warn');

  return (
    <div className="dashboard-page page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="section-label">Step 3 of 3 · Verification Dashboard</div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>
            🎓 Future Scholars Excellence Scholarship 2026
          </h2>
          <p className="page-subtitle">
            Application by: <strong>{application.fullName || '(unnamed)'}</strong>
            &nbsp;·&nbsp; Analyzed {report.analyzedAt.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Edit Application
          </button>
          {!report.isReady && (
            <button
              id="fix-docs-btn"
              className="btn btn-secondary"
              onClick={() => setShowUploadPanel(true)}
            >
              📤 Fix Documents
            </button>
          )}
          <button
            id="recheck-btn"
            className="btn btn-primary"
            onClick={onRecheck}
          >
            🔍 Re-run Check
          </button>
        </div>
      </div>

      {/* Readiness Banner */}
      {report.isReady ? (
        <div className="readiness-banner ready">
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div className="readiness-banner-title">Application is 100% Submission Ready</div>
            <div className="readiness-banner-sub">
              All {report.passCount} verification checks passed. Your application is ready to submit.
            </div>
          </div>
        </div>
      ) : (
        <div className={`readiness-banner ${report.riskLevel === 'high' ? 'high' : 'medium'}`}>
          <span style={{ fontSize: '1.5rem' }}>
            {report.riskLevel === 'high' ? '🚫' : '⚠️'}
          </span>
          <div style={{ flex: 1 }}>
            <div className="readiness-banner-title">
              {report.failCount} Critical Issue{report.failCount !== 1 ? 's' : ''} Detected
              {report.warnCount > 0 && ` + ${report.warnCount} Warning${report.warnCount !== 1 ? 's' : ''}`}
            </div>
            <div className="readiness-banner-sub">
              Score: {report.score}% — {report.riskLevel.toUpperCase()} RISK.
              Fix the issues below, then click "Re-run Check" to re-verify.
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowUploadPanel(true)}
          >
            Fix Issues →
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Checks
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'evidence_map' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence_map')}
        >
          🗺️ Evidence Map
          {issues.length > 0 && (
            <span className="dashboard-tab-badge">{issues.length}</span>
          )}
        </button>
      </div>

      {/* Upload Panel overlay */}
      {showUploadPanel && (
        <div className="fix-panel-overlay">
          <UploadPanel
            documents={documents}
            onDocumentsChange={onDocumentsChange}
            onClose={() => setShowUploadPanel(false)}
            onRecheck={onRecheck}
          />
        </div>
      )}

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="dashboard-layout">
          {/* Left: Score + Action Plan + AI Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Application Health */}
            <div className="action-plan">
              <div className="action-plan-header">
                <span>🏥</span>
                <span className="action-plan-title">Application Health</span>
              </div>
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Readiness Score:</span>
                  <span style={{ fontWeight: 600 }}>{report.score}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Verified Requirements:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{report.passCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Warnings:</span>
                  <span style={{ fontWeight: 600, color: report.warnCount > 0 ? '#fbbf24' : 'var(--text-primary)' }}>{report.warnCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Critical Issues (Blockers):</span>
                  <span style={{ fontWeight: 600, color: report.failCount > 0 ? 'var(--error)' : 'var(--text-primary)' }}>{report.failCount}</span>
                </div>
              </div>
            </div>

            <ScoreRing report={report} />

            {/* Action Plan */}
            {report.actionPlan.length > 0 && (
              <div className="action-plan">
                <div className="action-plan-header">
                  <span>🎯</span>
                  <span className="action-plan-title">What Should I Fix First?</span>
                </div>
                <div className="action-list">
                  {report.actionPlan.slice(0, 5).map((a, i) => (
                    <div key={i} className="action-item">
                      <div className="action-item-num">{i + 1}</div>
                      <div className="action-item-text">{a.text}</div>
                      <span className={`action-item-priority ${a.priority}`}>{a.priority}</span>
                    </div>
                  ))}
                </div>
                {!report.isReady && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowUploadPanel(true)}
                      style={{ width: '100%' }}
                    >
                      📤 Fix Documents & Recheck →
                    </button>
                  </div>
                )}
              </div>
            )}

            <AIChat report={report} />
          </div>

          {/* Right: Check Groups */}
          <div className="dashboard-right">
            {Object.entries(groups).map(([category, items]) => {
              const catStatus = getCategoryStatus(items);
              const failCount = items.filter(i => i.status === 'fail').length;
              const warnCount = items.filter(i => i.status === 'warn').length;

              return (
                <div key={category} className="check-group">
                  <div className="check-group-header">
                    <div className="check-group-title">
                      {CATEGORY_LABELS[category] || category}
                    </div>
                    <span className={`check-group-badge ${catStatus}`}>
                      {catStatus === 'pass' ? '✓ Pass' :
                       catStatus === 'warn' ? `⚠ ${warnCount} Warn` :
                       `✕ ${failCount} Fail`}
                    </span>
                  </div>
                  {items.map(item => (
                    <CheckItemRow key={item.id} item={item} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'evidence_map' && (
        <div className="evidence-map-page">
          <div className="evidence-map-layout">
            <div className="evidence-map-main">
              <EvidenceMap
                report={report}
                documents={documents}
                onFixNode={() => setShowUploadPanel(true)}
              />
            </div>
            <div className="evidence-map-sidebar">
              <ScoreRing report={report} />
              {report.actionPlan.length > 0 && (
                <div className="action-plan" style={{ marginTop: 16 }}>
                  <div className="action-plan-header">
                    <span>🎯</span>
                    <span className="action-plan-title">Priority Actions</span>
                  </div>
                  <div className="action-list">
                    {report.actionPlan.slice(0, 4).map((a, i) => (
                      <div key={i} className="action-item">
                        <div className="action-item-num">{i + 1}</div>
                        <div className="action-item-text">{a.text}</div>
                        <span className={`action-item-priority ${a.priority}`}>{a.priority}</span>
                      </div>
                    ))}
                  </div>
                  {!report.isReady && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowUploadPanel(true)}
                        style={{ width: '100%' }}
                      >
                        Fix Issues & Recheck →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
