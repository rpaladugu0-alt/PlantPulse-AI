import { useEffect, useRef } from "react";

export default function AnalysisPanel({ analysis, onClose, onFeedback }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!analysis) return undefined;
    const previous = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus?.();
    };
  }, [analysis, onClose]);
  if (!analysis) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="analysis-panel" role="dialog" aria-modal="true" aria-labelledby="analysis-title" aria-describedby="analysis-disclaimer">
      <button ref={closeRef} className="close-button" onClick={onClose} aria-label="Close analysis">×</button>
      <div className="eyebrow">AI-ASSISTED CONDITION ANALYSIS</div>
      <div className="analysis-heading"><div><h2 id="analysis-title">{analysis.machine.name}</h2><p>{analysis.machine.id} · {analysis.machine.line}</p></div><div className={`risk-badge ${analysis.risk.toLowerCase()}`}>{analysis.risk} risk · {analysis.riskScore}</div></div>
      <div className="confidence"><span style={{ width: `${analysis.confidence}%` }} /><small>{analysis.confidence}% analysis confidence</small></div>
      <div className="signal-grid">{analysis.signals.map((signal) => <div className={`signal ${signal.level}`} key={signal.label}><span>{signal.label}</span><strong>{signal.value}{signal.unit}</strong><small>{signal.level}</small></div>)}</div>
      <h3>Why this was flagged</h3><ul className="reason-list">{analysis.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      <div className="recommendation"><strong>Recommended next step</strong><p>{analysis.recommendation}</p></div>
      <p className="disclaimer" id="analysis-disclaimer">{analysis.disclaimer}</p>
      <div className="feedback-row"><span>Was this analysis useful?</span><button onClick={() => onFeedback("helpful")}>Yes</button><button onClick={() => onFeedback("not-helpful")}>No</button></div>
    </section>
  </div>;
}
