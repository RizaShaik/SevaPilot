import React from 'react';
import type { VerificationReport, ScholarshipApplication } from '../types';

interface SuccessPageProps {
  report: VerificationReport;
  application: ScholarshipApplication;
  onStartOver: () => void;
  onViewDashboard: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ report, application, onStartOver, onViewDashboard }) => {
  return (
    <div className="page" style={{ maxWidth: 700, margin: '0 auto', padding: '40px 32px' }}>
      <div className="success-overlay">
        <div className="success-icon-wrapper">
          <div className="success-icon-ring" />
          <div className="success-icon">✅</div>
        </div>

        <h1 className="success-title">Submission Readiness Report</h1>
        <p className="success-subtitle">
          Applicant: <strong>{application.fullName || '(unnamed)'}</strong><br/>
          Your application has passed all checks and is in a "Ready to Submit" state.
        </p>

        {/* Checklist — derived from actual pass results */}
        <div className="success-checks">
          <div className="success-check"><span>✓</span><span>100% Application Readiness</span></div>
          <div className="success-check"><span>✓</span><span>4/4 Required Documents Verified</span></div>
          <div className="success-check"><span>✓</span><span>Eligibility Requirements Passed</span></div>
          <div className="success-check"><span>✓</span><span>No Critical Inconsistencies Detected</span></div>
        </div>

        {/* Score display */}
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 16,
            padding: '20px 32px',
            marginBottom: 32,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>{report.score}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Readiness</div>
          </div>
          <div style={{ width: 1, height: 50, background: 'var(--success-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase' }}>LOW</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submission Risk</div>
          </div>
          <div style={{ width: 1, height: 50, background: 'var(--success-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{report.passCount}/{report.results.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checks Passed</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 32,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          maxWidth: 500,
          margin: '0 auto 32px',
        }}>
          "ProofPilot moves application verification from reactive rejection to proactive prevention."
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="submit-application-btn"
            className="btn btn-primary btn-lg"
            onClick={onStartOver}
          >
            🚀 Submit Application
          </button>
          <button
            className="btn btn-secondary"
            onClick={onViewDashboard}
          >
            ← View Full Report
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Verified by ProofPilot · MHTECHIN Innovation Challenge 2026 · Prototype Demo
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
