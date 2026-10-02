import React, { useEffect, useRef, useState } from 'react';
import type { VerificationReport, RiskLevel } from '../types';

interface ScoreRingProps {
  report: VerificationReport;
}

const RADIUS = 76;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRingColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

function getRiskColor(risk: RiskLevel): string {
  if (risk === 'low') return 'low';
  if (risk === 'medium') return 'medium';
  return 'high';
}

const ScoreRing: React.FC<ScoreRingProps> = ({ report }) => {
  const [animated, setAnimated] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // slight delay so CSS transition fires
      setTimeout(() => setAnimated(true), 100);
    } else {
      setAnimated(false);
      setTimeout(() => setAnimated(true), 50);
    }
  }, [report.score]);

  const color = getRingColor(report.score);
  const offset = animated
    ? CIRCUMFERENCE * (1 - report.score / 100)
    : CIRCUMFERENCE;

  return (
    <div className="score-card">
      <div className="score-ring-wrapper">
        <svg className="score-ring-svg" viewBox="0 0 180 180">
          <circle
            className="score-ring-bg"
            cx="90"
            cy="90"
            r={RADIUS}
          />
          <circle
            className={`score-ring-fill ${color}`}
            cx="90"
            cy="90"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="score-center">
          <span className={`score-value ${color}`}>{report.score}%</span>
          <span className="score-label">Ready</span>
        </div>
      </div>

      <div className="score-title">Application Readiness</div>
      <div className={`risk-badge ${getRiskColor(report.riskLevel)}`}>
        <span>⚡</span>
        Submission Risk: {report.riskLevel.toUpperCase()}
      </div>

      <div className="score-meta">
        Analyzed {report.analyzedAt.toLocaleTimeString()}
      </div>

      <div className="score-stats">
        <div className="score-stat">
          <span className="score-stat-value" style={{ color: 'var(--success)' }}>
            {report.passCount}
          </span>
          <span className="score-stat-label">Passed</span>
        </div>
        <div className="score-stat">
          <span className="score-stat-value" style={{ color: 'var(--error)' }}>
            {report.failCount}
          </span>
          <span className="score-stat-label">Issues</span>
        </div>
        <div className="score-stat">
          <span className="score-stat-value" style={{ color: 'var(--warning)' }}>
            {report.warnCount}
          </span>
          <span className="score-stat-label">Warnings</span>
        </div>
        <div className="score-stat">
          <span className="score-stat-value" style={{ color: 'var(--brand-primary)' }}>
            {report.results.length}
          </span>
          <span className="score-stat-label">Checks</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreRing;
