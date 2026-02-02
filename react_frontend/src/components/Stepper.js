import React from "react";

// PUBLIC_INTERFACE
export default function Stepper({ steps, activeIndex, onStepClick }) {
  /** Horizontal wizard stepper (clickable for visited steps). */
  return (
    <ol className="stepper" aria-label="Wizard steps">
      {steps.map((s, idx) => {
        const active = idx === activeIndex;
        const done = idx < activeIndex;

        return (
          <li key={s} className={`stepper-item ${active ? "active" : ""} ${done ? "done" : ""}`}>
            <button
              type="button"
              className="stepper-button"
              onClick={() => onStepClick(idx)}
              aria-current={active ? "step" : undefined}
            >
              <span className="stepper-dot" aria-hidden="true">
                {done ? "✓" : idx + 1}
              </span>
              <span className="stepper-label">{s}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
