import React, { useState, useRef, useEffect } from 'react';
import type { VerificationReport } from '../types';

interface AIChatProps {
  report: VerificationReport;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const QUICK_PROMPTS = [
  "Why isn't my application ready?",
  "What should I fix first?",
  "Why was this document flagged?",
  "Am I eligible for this scholarship?",
];

function generateDeterministicResponse(
  question: string,
  report: VerificationReport
): string {
  const q = question.toLowerCase();
  const issues = report.results.filter(r => r.status === 'fail' || r.status === 'warn');
  const criticals = issues.filter(r => r.severity === 'critical');

  if (q.includes('why') && (q.includes('ready') || q.includes('not ready'))) {
    if (report.isReady) {
      return `Your application is fully ready! All ${report.passCount} checks passed with a score of ${report.score}%. You're good to submit.`;
    }
    const reasons = criticals.slice(0, 3).map(r => `• ${r.title}: ${r.explanation}`).join('\n');
    return `Your application has a readiness score of ${report.score}% due to ${criticals.length} critical issue(s):\n\n${reasons}\n\nFix these to improve your score.`;
  }

  if (q.includes('fix first') || q.includes('what should')) {
    if (report.actionPlan.length === 0) {
      return 'No actions needed — your application is 100% ready to submit! 🎉';
    }
    const top = report.actionPlan.slice(0, 3);
    return `Here are your top priority actions:\n\n${top.map((a, i) => `${i + 1}. [${a.priority.toUpperCase()}] ${a.text}`).join('\n')}`;
  }

  if (q.includes('document') || q.includes('flagged')) {
    const docIssues = report.results.filter(r =>
      (r.status === 'fail' || r.status === 'warn') &&
      ['completeness', 'document_type', 'expiry', 'near_expiry'].includes(r.category)
    );
    if (docIssues.length === 0) {
      return 'All your documents look good! No document issues were detected.';
    }
    return `I found ${docIssues.length} document issue(s):\n\n${docIssues.map(d => `• ${d.title}: ${d.explanation}`).join('\n')}`;
  }

  if (q.includes('eligible') || q.includes('eligibility')) {
    const eligIssues = report.results.filter(r => r.category === 'eligibility' && r.status === 'fail');
    if (eligIssues.length === 0) {
      return `Based on the information provided, you meet all eligibility criteria:\n✅ CGPA requirement\n✅ Income requirement`;
    }
    return `There are eligibility concerns:\n\n${eligIssues.map(e => `❌ ${e.title}: ${e.explanation}`).join('\n')}`;
  }

  if (q.includes('score')) {
    return `Your current readiness score is ${report.score}%. This is calculated from ${report.results.length} automated checks: ${report.passCount} passed, ${report.failCount} failed, and ${report.warnCount} warnings. Fix the critical issues to boost your score.`;
  }

  // Generic fallback
  if (report.isReady) {
    return `Your application looks fully ready with a score of ${report.score}%! All checks have passed. You can proceed to submit.`;
  }
  return `Your application score is ${report.score}% with ${report.failCount} issue(s) to resolve. The most important action: ${report.actionPlan[0]?.text ?? 'review the detected issues above'}. Ask me anything more specific!`;
}

const AIChat: React.FC<AIChatProps> = ({ report }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: report.isReady
        ? `✅ Your application looks great! Score: ${report.score}%. You're ready to submit. Ask me anything about your application.`
        : `I've analyzed your application. Score: ${report.score}% | ${report.failCount} issue(s) found. Ask me why, what to fix, or about specific checks.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: 'ai',
        text: report.isReady
          ? `✅ Your application looks great! Score: ${report.score}%. You're ready to submit. Ask me anything about your application.`
          : `I've analyzed your application. Score: ${report.score}% | ${report.failCount} issue(s) found. Ask me why, what to fix, or about specific checks.`,
      },
    ]);
  }, [report]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateDeterministicResponse(text, report);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <div className="ai-avatar">✨</div>
        <div>
          <div className="ai-chat-title">Ask ProofPilot</div>
          <div className="ai-chat-subtitle">AI-assisted verification explainer</div>
        </div>
        <span className="tag tag-info" style={{ marginLeft: 'auto' }}>Deterministic</span>
      </div>

      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className="ai-message">
            {msg.role === 'ai' && (
              <div className="ai-message-avatar">🛡️</div>
            )}
            <div
              className="ai-message-bubble"
              style={msg.role === 'user' ? {
                background: 'rgba(108,142,255,0.08)',
                border: '1px solid rgba(108,142,255,0.2)',
                marginLeft: '20px',
                whiteSpace: 'pre-line',
              } : { whiteSpace: 'pre-line' }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="ai-message">
            <div className="ai-message-avatar">🛡️</div>
            <div className="ai-message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="loading-spinner" style={{ width: 16, height: 16 }} />
              <span style={{ color: 'var(--text-muted)' }}>Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-quick-prompts">
        {QUICK_PROMPTS.map(p => (
          <button key={p} className="ai-prompt-chip" onClick={() => handleSend(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="ai-chat-input-row">
        <input
          className="ai-input"
          placeholder="Ask about your application..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(input)}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSend(input)}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat;
