import React, { useMemo } from "react";
import { defaultExportFilenames, downloadTextFile } from "../utils/exports";

// PUBLIC_INTERFACE
export default function OutputExport({ projectName, solutionMd, presentationMd }) {
  /** Export controls for solution and presentation artifacts. */
  const names = useMemo(() => defaultExportFilenames(projectName), [projectName]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800 }}>Exports</div>
            <div className="muted">Download markdown/text locally. Print to PDF using your browser.</div>
          </div>
          <button type="button" className="btn no-print" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="grid-2">
          <div className="export-box">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Structured Solution Document</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              {names.solutionMd}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="no-print">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  downloadTextFile({
                    filename: names.solutionMd,
                    content: solutionMd || "",
                    mime: "text/markdown;charset=utf-8",
                  })
                }
                disabled={!solutionMd}
              >
                Download .md
              </button>
            </div>
          </div>

          <div className="export-box">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Client-ready Presentation Outline</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              {names.deckMd} / {names.deckTxt}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="no-print">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  downloadTextFile({
                    filename: names.deckMd,
                    content: presentationMd || "",
                    mime: "text/markdown;charset=utf-8",
                  })
                }
                disabled={!presentationMd}
              >
                Download .md
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  downloadTextFile({
                    filename: names.deckTxt,
                    content: presentationMd || "",
                    mime: "text/plain;charset=utf-8",
                  })
                }
                disabled={!presentationMd}
              >
                Download .txt
              </button>
            </div>
          </div>
        </div>

        <hr className="sep" />

        <div className="muted">
          Tip: use <strong>Print / Save as PDF</strong> to export the full page with print styles.
        </div>
      </div>
    </div>
  );
}
