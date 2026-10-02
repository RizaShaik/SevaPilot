import React, { useState } from 'react';
import type { VerificationReport, EvidenceMapNode, EvidenceNodeStatus, VerificationResult } from '../types';
import { SCHOLARSHIP_REQUIREMENTS } from '../data';
import type { UploadedDocument } from '../types';

interface EvidenceMapProps {
  report: VerificationReport;
  documents: UploadedDocument[];
  onFixNode?: (slotId: string) => void;
}

function buildEvidenceNodes(
  report: VerificationReport,
  documents: UploadedDocument[]
): EvidenceMapNode[] {
  return SCHOLARSHIP_REQUIREMENTS.requiredDocuments.map(slot => {
    const doc = documents.find(d => d.slotId === slot.id);
    const slotResults = report.results.filter(r => r.relatedSlot === slot.id);
    const issues = slotResults.filter(r => r.status === 'fail' || r.status === 'warn');
    const passes = slotResults.filter(r => r.status === 'pass');

    let status: EvidenceNodeStatus;
    if (!doc) {
      status = 'missing';
    } else if (issues.some(i => i.status === 'fail')) {
      status = 'issue';
    } else if (issues.some(i => i.status === 'warn')) {
      status = 'warning';
    } else {
      status = 'verified';
    }

    return {
      requirementId: slot.id,
      requirementLabel: slot.label,
      requirementIcon: slot.icon,
      status,
      documentName: doc?.file.name,
      detectedType: doc?.metadata.documentType,
      issues,
      passes,
    };
  });
}

const STATUS_CONFIG: Record<EvidenceNodeStatus, {
  label: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
}> = {
  verified: {
    label: 'Verified',
    icon: '✓',
    colorClass: 'node-verified',
    borderClass: 'node-border-verified',
    bgClass: 'node-bg-verified',
  },
  issue: {
    label: 'Issue',
    icon: '✕',
    colorClass: 'node-issue',
    borderClass: 'node-border-issue',
    bgClass: 'node-bg-issue',
  },
  missing: {
    label: 'Missing',
    icon: '○',
    colorClass: 'node-missing',
    borderClass: 'node-border-missing',
    bgClass: 'node-bg-missing',
  },
  warning: {
    label: 'Warning',
    icon: '⚠',
    colorClass: 'node-warning',
    borderClass: 'node-border-warning',
    bgClass: 'node-bg-warning',
  },
};

const ResultPill: React.FC<{ result: VerificationResult }> = ({ result }) => {
  const colorMap = {
    fail: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
    warn: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    pass: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
    skip: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  };
  const c = colorMap[result.status];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 12px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      marginTop: 6,
    }}>
      <span style={{ color: c.text, fontWeight: 700, fontSize: '0.8rem', marginTop: 1, flexShrink: 0 }}>
        {result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✕'}
      </span>
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{result.title}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
          {result.explanation}
        </div>
        {result.evidence && (
          <div style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            marginTop: 4, fontFamily: 'var(--font-mono)',
            padding: '2px 6px', background: 'rgba(0,0,0,0.2)',
            borderRadius: 4, display: 'inline-block',
          }}>
            {result.evidence}
          </div>
        )}
      </div>
    </div>
  );
};

const EvidenceNode: React.FC<{
  node: EvidenceMapNode;
  isExpanded: boolean;
  onToggle: () => void;
  onFix?: () => void;
}> = ({ node, isExpanded, onToggle, onFix }) => {
  const cfg = STATUS_CONFIG[node.status];
  const hasIssues = node.issues.length > 0;

  return (
    <div
      className={`evidence-node ${cfg.borderClass} ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      {/* Connection line (top) */}
      <div className="evidence-connector-v" />

      {/* Node header */}
      <div className={`evidence-node-header ${cfg.bgClass}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`evidence-status-dot ${cfg.colorClass}`}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>{node.requirementIcon}</span>
              <span style={{
                fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)'
              }}>
                {node.requirementLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Requirement
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`evidence-status-badge ${cfg.colorClass}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {/* Evidence chain */}
      <div className="evidence-chain">
        {/* Arrow */}
        <div className="evidence-arrow">
          <div className="evidence-arrow-line" />
          <span className="evidence-arrow-label">Evidence</span>
          <div className="evidence-arrow-head">▶</div>
        </div>

        {/* Document node */}
        <div className={`evidence-doc-node ${node.status === 'missing' ? 'missing' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.9rem' }}>
              {node.status === 'missing' ? '📭' : '📄'}
            </span>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {node.documentName ?? 'No document uploaded'}
              </div>
              {node.detectedType && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{node.detectedType.replace(/_/g, ' ')}</span>
                  <span style={{
                    padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                    background: node.status === 'verified' ? 'rgba(52,211,153,0.1)' : node.status === 'warning' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                    color: node.status === 'verified' ? 'var(--success)' : node.status === 'warning' ? '#fbbf24' : 'var(--error)',
                  }}>
                    Quality: {node.status === 'verified' ? 'High' : node.status === 'warning' ? 'Medium' : 'Low'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="evidence-arrow">
          <div className="evidence-arrow-line" />
          <span className="evidence-arrow-label">Checks</span>
          <div className="evidence-arrow-head">▶</div>
        </div>

        {/* Verdict node */}
        <div className={`evidence-verdict-node ${cfg.colorClass}`}>
          <span style={{ fontSize: '0.8rem' }}>
            {node.status === 'verified' && '✅ Verified'}
            {node.status === 'issue' && `🔴 ${node.issues.length} Issue${node.issues.length > 1 ? 's' : ''}`}
            {node.status === 'warning' && `⚠️ ${node.issues.length} Warning${node.issues.length > 1 ? 's' : ''}`}
            {node.status === 'missing' && '🔴 Missing'}
          </span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="evidence-detail" onClick={e => e.stopPropagation()}>
          <div className="evidence-detail-inner">
            {/* Issues */}
            {node.issues.length > 0 && (
              <div className="evidence-section">
                <div className="evidence-section-title" style={{ color: 'var(--error)' }}>
                  🚨 Issues Detected
                </div>
                {node.issues.map(r => <ResultPill key={r.id} result={r} />)}
              </div>
            )}

            {/* Passes */}
            {node.passes.length > 0 && (
              <div className="evidence-section" style={{ marginTop: node.issues.length > 0 ? 12 : 0 }}>
                <div className="evidence-section-title" style={{ color: 'var(--success)' }}>
                  ✓ Passed Checks
                </div>
                {node.passes.map(r => <ResultPill key={r.id} result={r} />)}
              </div>
            )}

            {/* No document at all */}
            {node.status === 'missing' && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(248,113,113,0.05)',
                borderRadius: 8,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}>
                This required document has not been submitted. The application cannot proceed without it.
              </div>
            )}

            {/* Fix button */}
            {hasIssues && onFix && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12, width: '100%' }}
                onClick={e => { e.stopPropagation(); onFix(); }}
              >
                🔧 Apply Fix for {node.requirementLabel}
              </button>
            )}
            {node.status === 'missing' && onFix && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12, width: '100%' }}
                onClick={e => { e.stopPropagation(); onFix(); }}
              >
                + Add {node.requirementLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EvidenceMap: React.FC<EvidenceMapProps> = ({ report, documents, onFixNode }) => {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const nodes = buildEvidenceNodes(report, documents);

  const verifiedCount = nodes.filter(n => n.status === 'verified').length;
  const issueCount = nodes.filter(n => n.status === 'issue').length;
  const missingCount = nodes.filter(n => n.status === 'missing').length;
  const warnCount = nodes.filter(n => n.status === 'warning').length;

  return (
    <div className="evidence-map">
      {/* Map legend / summary */}
      <div className="evidence-map-legend">
        <div className="evidence-legend-title">
          📡 Evidence Map
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8, fontWeight: 400 }}>
            Requirement → Evidence → Verification
          </span>
        </div>
        <div className="evidence-legend-stats">
          {verifiedCount > 0 && (
            <span className="evidence-legend-badge verified">{verifiedCount} Verified</span>
          )}
          {warnCount > 0 && (
            <span className="evidence-legend-badge warning">{warnCount} Warning</span>
          )}
          {issueCount > 0 && (
            <span className="evidence-legend-badge issue">{issueCount} Issues</span>
          )}
          {missingCount > 0 && (
            <span className="evidence-legend-badge missing">{missingCount} Missing</span>
          )}
        </div>
      </div>

      {/* Also show eligibility checks (not slot-specific) */}
      <div className="evidence-eligibility-strip">
        <div className="evidence-eligibility-title">⚡ Eligibility Checks</div>
        <div className="evidence-eligibility-checks">
          {report.results
            .filter(r => r.category === 'eligibility' || (r.category === 'field' && r.id !== 'required_fields' && r.id !== 'required_fields_ok'))
            .map(r => (
              <div key={r.id} className={`evidence-eligibility-chip ${r.status}`}>
                <span>{r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✕'}</span>
                <span>{r.title}</span>
              </div>
            ))
          }
          {/* Field completeness */}
          {report.results.filter(r => r.id === 'required_fields' || r.id === 'required_fields_ok').map(r => (
            <div key={r.id} className={`evidence-eligibility-chip ${r.status}`}>
              <span>{r.status === 'pass' ? '✓' : '✕'}</span>
              <span>{r.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node list */}
      <div className="evidence-nodes">
        {nodes.map((node, idx) => (
          <div key={node.requirementId} className="evidence-node-wrapper">
            {idx > 0 && <div className="evidence-connector-h" />}
            <EvidenceNode
              node={node}
              isExpanded={expandedNode === node.requirementId}
              onToggle={() =>
                setExpandedNode(prev => prev === node.requirementId ? null : node.requirementId)
              }
              onFix={onFixNode ? () => onFixNode(node.requirementId) : undefined}
            />
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'rgba(108,142,255,0.04)',
        border: '1px dashed rgba(108,142,255,0.15)',
        borderRadius: 8, fontSize: '0.72rem', color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        💡 Click any requirement node to inspect the evidence chain and verification result.
        {report.failCount > 0 && ' Use "Fix Issues & Recheck" to resolve detected problems.'}
      </div>
    </div>
  );
};

export default EvidenceMap;
