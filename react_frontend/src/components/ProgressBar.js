import React from "react";

// PUBLIC_INTERFACE
export default function ProgressBar({ value, label }) {
  /** Simple progress bar (0..1). */
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;

  return (
    <div className="progress" aria-label={label || "Progress"}>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-meta">
        <span className="muted">{label}</span>
        <span className="badge badge-primary">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
