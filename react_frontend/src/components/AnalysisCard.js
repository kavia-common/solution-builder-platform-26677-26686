import React, { useMemo, useState } from "react";

function toTextareaList(items) {
  return (items || []).join("\n");
}

function fromTextareaList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// PUBLIC_INTERFACE
export default function AnalysisCard({ analysis, onPatch }) {
  /** Card for viewing/editing analysis per document. */
  const [open, setOpen] = useState(false);

  const entities = useMemo(() => analysis?.entities || [], [analysis?.entities]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800 }}>{analysis?.title || "Untitled"}</div>
            <div className="muted" style={{ marginTop: 2 }}>
              {entities.length ? entities.slice(0, 6).map((e) => <span key={e} className="badge" style={{ marginRight: 6 }}>{e}</span>) : "No entities detected"}
            </div>
          </div>
          <button type="button" className="btn" onClick={() => setOpen((v) => !v)} aria-expanded={open ? "true" : "false"}>
            {open ? "Hide" : "Edit"}
          </button>
        </div>
      </div>

      <div className="card-body">
        {!open ? (
          <>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{analysis?.summary}</div>
            <hr className="sep" />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Key points</div>
            <ul>
              {(analysis?.keyPoints || []).slice(0, 6).map((k, idx) => (
                <li key={`${analysis?.id}_${idx}`}>{k}</li>
              ))}
            </ul>
            {analysis?.notes ? (
              <>
                <hr className="sep" />
                <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Notes:</strong> {analysis.notes}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="grid-2">
            <div>
              <label className="label" htmlFor={`title_${analysis?.id}`}>Title</label>
              <input
                id={`title_${analysis?.id}`}
                className="input"
                value={analysis?.title || ""}
                onChange={(e) => onPatch?.({ title: e.target.value })}
              />

              <div style={{ height: 12 }} />

              <label className="label" htmlFor={`summary_${analysis?.id}`}>Summary</label>
              <textarea
                id={`summary_${analysis?.id}`}
                value={analysis?.summary || ""}
                onChange={(e) => onPatch?.({ summary: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor={`kp_${analysis?.id}`}>Key points (one per line)</label>
              <textarea
                id={`kp_${analysis?.id}`}
                value={toTextareaList(analysis?.keyPoints)}
                onChange={(e) => onPatch?.({ keyPoints: fromTextareaList(e.target.value) })}
              />

              <div style={{ height: 12 }} />

              <label className="label" htmlFor={`notes_${analysis?.id}`}>Corrections / Notes</label>
              <textarea
                id={`notes_${analysis?.id}`}
                value={analysis?.notes || ""}
                onChange={(e) => onPatch?.({ notes: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
