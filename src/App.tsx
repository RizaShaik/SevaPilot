import { useState, useCallback } from 'react';
import './index.css';

import type { ScholarshipApplication, UploadedDocument, AppStep } from './types';
import { EMPTY_APPLICATION } from './types';
import { verify } from './verificationEngine';
import type { VerificationReport } from './types';

import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AppTypeSelector from './components/AppTypeSelector';
import ScholarshipForm from './components/ScholarshipForm';
import Analyzing from './components/Analyzing';
import Dashboard from './components/Dashboard';
import SuccessPage from './components/SuccessPage';
import Stepper from './components/Stepper';

function App() {
  const [step, setStep] = useState<AppStep>('landing');

  // ── Core Application State ─────────────────────────────────
  // Application always starts EMPTY. No prefilled data.
  const [application, setApplication] = useState<ScholarshipApplication>(EMPTY_APPLICATION);
  // Documents always start empty. No preloaded docs.
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [report, setReport] = useState<VerificationReport | null>(null);

  // ── Verification ───────────────────────────────────────────
  const handleVerify = useCallback(() => {
    setStep('analyzing');
  }, []);

  const handleAnalysisComplete = useCallback(() => {
    const result = verify(application, documents);
    setReport(result);
    setStep('dashboard');
  }, [application, documents]);

  // ── Fix → Recheck ──────────────────────────────────────────
  // Called when user goes back to form (edit application or replace docs) and re-verifies.
  // There are NO simulated fixes — the user must actually change their data.
  const handleRecheck = useCallback(() => {
    setStep('analyzing');
  }, []);

  // ── Demo Scenario Loading ──────────────────────────────────
  // ONLY called when user explicitly clicks "Load Demo Scenario".
  // Never called automatically.
  const handleLoadDemo = useCallback((app: ScholarshipApplication, docs: UploadedDocument[]) => {
    setApplication(app);
    setDocuments(docs);
  }, []);

  // ── Navigation ─────────────────────────────────────────────
  const handleLogoClick = useCallback(() => {
    setStep('landing');
  }, []);

  const handleStartOver = useCallback(() => {
    setApplication(EMPTY_APPLICATION);
    setDocuments([]);
    setReport(null);
    setStep('landing');
  }, []);

  return (
    <div className="app-container">
      <Navbar onLogoClick={handleLogoClick} currentStep={step} />

      {/* Stepper — show for form/dashboard steps */}
      {(step === 'select' || step === 'form' || step === 'dashboard') && (
        <div style={{ paddingTop: 32 }}>
          <Stepper
            currentStep={
              step === 'select' ? 'select' :
              step === 'form' ? 'form' : 'dashboard'
            }
          />
        </div>
      )}

      {step === 'landing' && (
        <LandingPage onStart={() => setStep('select')} />
      )}

      {step === 'select' && (
        <AppTypeSelector onSelect={() => setStep('form')} />
      )}

      {step === 'form' && (
        <ScholarshipForm
          application={application}
          documents={documents}
          onAppChange={setApplication}
          onDocumentsChange={setDocuments}
          onLoadDemo={handleLoadDemo}
          onSubmit={handleVerify}
          onBack={() => setStep('select')}
        />
      )}

      {step === 'analyzing' && (
        <Analyzing onComplete={handleAnalysisComplete} />
      )}

      {step === 'dashboard' && report && (
        <>
          {report.isReady ? (
            <SuccessPage
              report={report}
              application={application}
              onStartOver={handleStartOver}
              onViewDashboard={() => setStep('dashboard')}
            />
          ) : (
            <Dashboard
              report={report}
              application={application}
              documents={documents}
              onDocumentsChange={setDocuments}
              onAppChange={setApplication}
              onRecheck={handleRecheck}
              onBack={() => setStep('form')}
            />
          )}
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <span className="footer-brand">SevaPilot</span>
        <span className="footer-text">
          Build Fast With AI · Prototype — not production software
        </span>
        <span className="footer-text">
          Built with Vite + React + TypeScript
        </span>
      </footer>
    </div>
  );
}

export default App;
