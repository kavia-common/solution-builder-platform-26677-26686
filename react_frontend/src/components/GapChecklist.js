import React, { useMemo, useState } from "react";

// PUBLIC_INTERFACE
export default function GapChecklist({ gaps, onUpdateGap, onAddManualGap }) {
  /** Checklist for gap suggestions. */
  const [manualTitle, setManualTitle] = useState("");
  const [manualOutline, setManualOutline] = useState("");

  const acceptedCount = useMemo(() => (gaps || []).filter((g) => g.accepted).length, [gaps]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800 }}>Identified gaps</div>
            <div className="muted">Select gaps to include in the generated outputs.</div>
          </div>
          <span className="badge badge-accent">{acceptedCount} selected</span>
        </div>
      </div>

      <div className="card-body">
        {(gaps || []).length ? (
          <div className="stack">
            {(gaps || []).map((g) => (
              <div key={g.id} className="gap-item">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <label className="row" style={{ gap: 10, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!g.accepted}
                      onChange={(e) => onUpdateGap?.(g.id, { accepted: e.target.checked })}
                      aria-label={`Select gap: ${g.title}`}
                    />
                    <span style={{ fontWeight: 700 }}>{g.title}</span>
                    <span className="badge">{g.source === "manual" ? "manual" : "auto"}</span>
                  </label>

                  <button type="button" className="btn" onClick={() => onUpdateGap?.(g.id, { expanded: !g.expanded })}>
                    {g.expanded ? "Hide" : "Details"}
                  </button>
                </div>

                {g.expanded ? (
                  <div style={{ marginTop: 12 }} className="grid-2">
                    <div>
                      <div className="muted" style={{ fontWeight: 700, marginBottom: 6 }}>Suggested outline</div>
                      <ul>
                        {(g.outline || []).map((o, idx) => (
                          <li key={`${g.id}_o_${idx}`}>{o}</li>
                        ))}
                      </ul>

                      <div style={{ height: 10 }} />

                      <label className="label" htmlFor={`gap_title_${g.id}`}>Title</label>
                      <input
                        id={`gap_title_${g.id}`}
                        className="input"
                        value={g.title || ""}
                        onChange={(e) => onUpdateGap?.(g.id, { title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="label" htmlFor={`gap_details_${g.id}`}>Resolution notes (optional)</label>
                      <textarea
                        id={`gap_details_${g.id}`}
                        value={g.details || ""}
                        onChange={(e) => onUpdateGap?.(g.id, { details: e.target.value })}
                        placeholder="Add decisions, constraints, or specifics to include in the solution doc..."
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No gaps detected. You can add one manually below.</div>
        )}

        <hr className="sep" />

        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Add a manual gap</div>
          <div className="grid-2">
            <div>
              <label className="label" htmlFor="manual_gap_title">Gap title</label>
              <input
                id="manual_gap_title"
                className="input"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g., Data retention & privacy"
              />
            </div>
            <div>
              <label className="label" htmlFor="manual_gap_outline">Outline (one per line)</label>
              <textarea
                id="manual_gap_outline"
                value={manualOutline}
                onChange={(e) => setManualOutline(e.target.value)}
                placeholder={"Item 1\nItem 2\nItem 3"}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                const title = manualTitle.trim();
                if (!title) return;
                const outline = manualOutline
                  .split(/\r?\n/)
                  .map((l) => l.trim())
                  .filter(Boolean);
                onAddManualGap?.({ title, outline });
                setManualTitle("");
                setManualOutline("");
              }}
            >
              Add gap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
