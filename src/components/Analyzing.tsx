import React, { useState, useEffect } from 'react';

interface AnalyzingProps {
  onComplete: () => void;
}

const STEPS = [
  'Parsing application fields...',
  'Checking eligibility criteria...',
  'Scanning document completeness...',
  'Validating document types...',
  'Checking expiry dates...',
  'Running name consistency checks...',
  'Cross-referencing data fields...',
  'Detecting duplicates...',
  'Computing readiness score...',
];

const Analyzing: React.FC<AnalyzingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      setDoneSteps(prev => [...prev, step]);
      step++;
      setCurrentStep(step);
      if (step >= STEPS.length) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 220);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="analyzing-overlay page">
      <div className="analyzing-spinner" />
      <div>
        <h2 className="analyzing-title">Analyzing Your Application</h2>
        <p className="analyzing-desc">Running 9 verification checks across eligibility, documents, and consistency...</p>
      </div>
      <div className="analyzing-steps">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`analyzing-step ${doneSteps.includes(i) ? 'done' : i === currentStep ? 'active' : ''}`}
          >
            <span style={{ width: 16, textAlign: 'center' }}>
              {doneSteps.includes(i) ? '✓' : i === currentStep ? '›' : '○'}
            </span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analyzing;
