import React from 'react';

interface AppTypeSelectorProps {
  onSelect: (type: string) => void;
}

const APP_TYPES = [
  {
    id: 'scholarship',
    icon: '🎓',
    name: 'Scholarship',
    desc: 'Education scholarships & financial aid applications',
    badge: 'Available',
    badgeClass: '',
    active: true,
  },
  {
    id: 'internship',
    icon: '💼',
    name: 'Internship',
    desc: 'Government & private internship applications',
    badge: 'Coming Soon',
    badgeClass: 'coming-soon',
    active: false,
  },
  {
    id: 'government',
    icon: '🏛',
    name: 'Government Scheme',
    desc: 'Welfare scheme and subsidy applications',
    badge: 'Coming Soon',
    badgeClass: 'coming-soon',
    active: false,
  },
  {
    id: 'insurance',
    icon: '🏥',
    name: 'Insurance Claim',
    desc: 'Health & life insurance claim processing',
    badge: 'Coming Soon',
    badgeClass: 'coming-soon',
    active: false,
  },
];

const AppTypeSelector: React.FC<AppTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="app-type-page page">
      <div className="page-header">
        <div className="section-label">Step 1 of 3</div>
        <h2 className="page-title">What are you applying for?</h2>
        <p className="page-subtitle">
          Choose the application type to configure the right verification checks.
        </p>
      </div>

      <div className="app-types-grid">
        {APP_TYPES.map(t => (
          <div
            key={t.id}
            id={`app-type-${t.id}`}
            className={`app-type-card ${!t.active ? 'disabled' : ''}`}
            onClick={() => t.active && onSelect(t.id)}
            role="button"
            tabIndex={t.active ? 0 : -1}
          >
            <div className="app-type-icon">{t.icon}</div>
            <div className="app-type-name">{t.name}</div>
            <div className="app-type-desc">{t.desc}</div>
            <span className={`app-type-badge ${t.badgeClass}`}>{t.badge}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Hackathon Prototype Note
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            The <strong>Scholarship</strong> workflow is fully functional with 4 demo scenarios.
            Other types are shown as future roadmap items and demonstrate the platform's scalability.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTypeSelector;
