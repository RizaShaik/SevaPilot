import React from 'react';

interface StepperProps {
  currentStep: 'select' | 'form' | 'dashboard';
}

const STEPS = [
  { id: 'select', label: 'Select Type' },
  { id: 'form', label: 'Application' },
  { id: 'dashboard', label: 'Verification' },
];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        const status =
          idx < currentIdx ? 'done' :
          idx === currentIdx ? 'active' : '';
        return (
          <div key={step.id} className={`step ${status}`}>
            <div className="step-circle">
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
