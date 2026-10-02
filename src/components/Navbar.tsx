import React from 'react';

interface NavbarProps {
  onLogoClick: () => void;
  currentStep: string;
}

const Navbar: React.FC<NavbarProps> = ({ onLogoClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={onLogoClick} role="button" tabIndex={0}>
        <div className="navbar-logo">🛡️</div>
        <div>
          <div className="navbar-title">ProofPilot</div>
          <div className="navbar-subtitle">Application Verification Copilot</div>
        </div>
      </div>
      <div className="navbar-actions">
        <span className="badge-hackathon">MHTECHIN 2026</span>
      </div>
    </nav>
  );
};

export default Navbar;
