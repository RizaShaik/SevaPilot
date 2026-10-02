import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const FEATURES = [
  {
    icon: '📋',
    title: 'Document Completeness',
    desc: 'Detects missing required documents before you submit.',
  },
  {
    icon: '🏷️',
    title: 'Document Type Validation',
    desc: 'Flags wrong document types uploaded in incorrect slots.',
  },
  {
    icon: '📅',
    title: 'Expiry & Validity Check',
    desc: 'Catches expired documents and warns about those expiring soon.',
  },
  {
    icon: '🔀',
    title: 'Consistency Analysis',
    desc: 'Cross-checks names and data between form and all documents.',
  },
  {
    icon: '⚡',
    title: 'Eligibility Screening',
    desc: 'Automatically checks CGPA, income, and other criteria.',
  },
  {
    icon: '🎯',
    title: 'Action Plan',
    desc: 'Prioritized, step-by-step fix list to get to 100% ready.',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            MHTECHIN Innovation Challenge 2026
          </div>

          <h1 className="hero-title">
            Know your application is{' '}
            <span className="hero-title-gradient">ready</span>
            <br />
            before you submit.
          </h1>

          <p className="hero-subtitle">
            ProofPilot is an AI-assisted pre-submission verification copilot that
            catches missing documents, eligibility failures, inconsistencies, and
            expired documents — before they get you rejected.
          </p>

          <div className="hero-actions">
            <button
              id="hero-cta-btn"
              className="btn btn-primary btn-lg"
              onClick={onStart}
            >
              🚀 Try the Demo
            </button>
            <button className="btn btn-secondary btn-lg" onClick={onStart}>
              See How It Works →
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">9</span>
              <span className="stat-label">Verification Checks</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">4</span>
              <span className="stat-label">Demo Scenarios</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Readiness Target</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product tagline */}
      <section style={{ textAlign: 'center', padding: '32px 32px 0', maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(108,142,255,0.06), rgba(167,139,250,0.04))',
            border: '1px solid rgba(108,142,255,0.2)',
            borderRadius: '16px',
            padding: '28px 32px',
          }}
        >
          <div style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.6 }}>
            "ProofPilot moves application verification from{' '}
            <span style={{ color: 'var(--error)', fontWeight: 700 }}>reactive rejection</span>
            {' '}to{' '}
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>proactive prevention</span>."
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-label">What We Check</div>
        <h2 className="section-title">Complete verification, before submission</h2>
        <p className="section-desc">
          ProofPilot runs 9 automated verification checks across eligibility,
          documents, validity, and data consistency.
        </p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ textAlign: 'center', padding: '48px 32px 80px' }}>
        <button
          id="hero-cta-bottom-btn"
          className="btn btn-primary btn-lg"
          onClick={onStart}
        >
          Start Verification →
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Prototype · No login required · Instant results
        </p>
      </section>
    </div>
  );
};

export default LandingPage;
