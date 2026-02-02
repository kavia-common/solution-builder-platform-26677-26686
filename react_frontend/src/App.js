import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { WizardProvider, useWizard } from "./context/WizardContext";
import { WIZARD_STEPS } from "./theme";
import ProgressBar from "./components/ProgressBar";
import Stepper from "./components/Stepper";
import FileDropzone from "./components/FileDropzone";
import AnalysisCard from "./components/AnalysisCard";
import GapChecklist from "./components/GapChecklist";
import OutputExport from "./components/OutputExport";
import DemoPreview from "./components/DemoPreview";

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function StepInput() {
  const { state, actions } = useWizard();

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 900, fontSize: 18 }}>1) Input</div>
          <div className="muted">Upload project documents (offline-first). TXT/MD are read locally; PDF/DOCX use simulated extraction placeholders.</div>
        </div>
        <div className="card-body">
          <FileDropzone onFiles={(files) => actions.addFiles(files)} error={state.ui.error} isProcessing={state.ui.isProcessing} />

          <div className="file-list" aria-label="Uploaded files list">
            {state.documents.map((d) => (
              <div className="file-item" key={d.id}>
                <div className="file-meta">
                  <div className="file-name">{d.name}</div>
                  <div className="file-sub">
                    {d.ext?.toUpperCase() || d.type} · {formatBytes(d.size)}
                  </div>
                </div>

                <button type="button" className="btn btn-danger" onClick={() => actions.removeDocument(d.id)} aria-label={`Remove ${d.name}`}>
                  Remove
                </button>
              </div>
            ))}
            {!state.documents.length ? <div className="muted" style={{ marginTop: 8 }}>No files yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 800 }}>Next step</div>
          <div className="muted">Run analysis to generate summaries and project context.</div>
        </div>
        <div className="card-body">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              await actions.runAnalysis();
              actions.nextStep();
            }}
            disabled={!state.documents.length || state.ui.isProcessing}
          >
            {state.ui.isProcessing ? "Processing..." : "Run analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepAnalysis() {
  const { state, actions } = useWizard();

  useEffect(() => {
    // Ensure analysis exists when entering step (from persistence or direct navigation)
    if (!state.analysis && state.documents.length && !state.ui.isProcessing) {
      actions.runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex]);

  const projectContext = state.analysis?.projectContext;

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 900, fontSize: 18 }}>2) Analysis</div>
          <div className="muted">Review and edit the generated summaries and project context.</div>
        </div>

        <div className="card-body">
          {state.ui.error ? <div className="inline-error" role="alert">{state.ui.error}</div> : null}

          {state.ui.isProcessing && !state.analysis ? (
            <div className="muted">Generating analysis...</div>
          ) : null}

          {state.analysis ? (
            <div className="grid-2">
              <div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Aggregated project context</div>

                <label className="label" htmlFor="proj_name">Project name</label>
                <input
                  id="proj_name"
                  className="input"
                  value={projectContext?.projectName || ""}
                  onChange={(e) => actions.updateProjectContext({ projectName: e.target.value })}
                />

                <div style={{ height: 12 }} />

                <label className="label" htmlFor="proj_domain">Detected domain</label>
                <input
                  id="proj_domain"
                  className="input"
                  value={projectContext?.domain || ""}
                  onChange={(e) => actions.updateProjectContext({ domain: e.target.value })}
                />

                <div style={{ height: 12 }} />

                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-primary">Themes</span>
                  {(projectContext?.themes || []).length ? (
                    projectContext.themes.map((t) => <span key={t} className="badge">{t}</span>)
                  ) : (
                    <span className="muted">None detected</span>
                  )}
                </div>

                <div style={{ height: 10 }} />

                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-accent">Entities</span>
                  {(projectContext?.entities || []).length ? (
                    projectContext.entities.map((e) => <span key={e} className="badge">{e}</span>)
                  ) : (
                    <span className="muted">None detected</span>
                  )}
                </div>

                <div style={{ height: 12 }} />

                <label className="label" htmlFor="proj_notes">Notes</label>
                <textarea
                  id="proj_notes"
                  value={projectContext?.notes || ""}
                  onChange={(e) => actions.updateProjectContext({ notes: e.target.value })}
                  placeholder="Optional: add context that should influence generated outputs..."
                />
              </div>

              <div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Per-document analysis</div>
                <div className="stack">
                  {(state.analysis.perDoc || []).map((a) => (
                    <AnalysisCard
                      key={a.id}
                      analysis={a}
                      onPatch={(patch) => actions.updateAnalysisDoc(a.id, patch)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="footer-nav">
        <button type="button" className="btn" onClick={actions.prevStep}>Back</button>
        <button type="button" className="btn btn-primary" onClick={actions.nextStep} disabled={!state.analysis}>
          Continue to gaps
        </button>
      </div>
    </div>
  );
}

function StepGaps() {
  const { state, actions } = useWizard();

  useEffect(() => {
    if (!state.analysis && state.documents.length && !state.ui.isProcessing) {
      actions.runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex]);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 900, fontSize: 18 }}>3) Gaps</div>
          <div className="muted">Select missing sections typical for SOW/PRD/architecture deliverables.</div>
        </div>
        <div className="card-body">
          <GapChecklist
            gaps={state.gaps || []}
            onUpdateGap={(id, patch) => actions.updateGap(id, patch)}
            onAddManualGap={(g) => actions.addManualGap(g)}
          />
        </div>
      </div>

      <div className="footer-nav">
        <button type="button" className="btn" onClick={actions.prevStep}>Back</button>
        <button type="button" className="btn btn-primary" onClick={actions.nextStep}>
          Continue to approvals
        </button>
      </div>
    </div>
  );
}

function PreviewBlock({ title, children }) {
  return (
    <div className="summary-item">
      <div className="summary-title">{title}</div>
      <div className="summary-body">{children}</div>
    </div>
  );
}

function StepApprovals() {
  const { state, actions } = useWizard();
  const [confirmChecked, setConfirmChecked] = useState(state.approvals.approved);
  const [approver, setApprover] = useState(state.approvals.approver || "");

  const acceptedGaps = useMemo(() => (state.gaps || []).filter((g) => g.accepted), [state.gaps]);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 900, fontSize: 18 }}>4) Approvals</div>
          <div className="muted">Review consolidated preview and explicitly approve before generating outputs.</div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            <div>
              <PreviewBlock title="Inputs">
                {(state.documents || []).length
                  ? state.documents.map((d) => `• ${d.name}`).join("\n")
                  : "No documents uploaded."}
              </PreviewBlock>

              <div style={{ height: 10 }} />

              <PreviewBlock title="Project context">
                {state.analysis?.projectContext
                  ? `Project: ${state.analysis.projectContext.projectName}\nDomain: ${state.analysis.projectContext.domain}\nThemes: ${(state.analysis.projectContext.themes || []).join(", ") || "—"}`
                  : "No analysis yet."}
              </PreviewBlock>

              <div style={{ height: 10 }} />

              <PreviewBlock title="Selected gaps">
                {acceptedGaps.length
                  ? acceptedGaps.map((g) => `• ${g.title}`).join("\n")
                  : "No gaps selected."}
              </PreviewBlock>
            </div>

            <div>
              <div
                className="card"
                style={{
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                  background: "rgba(245, 158, 11, 0.12)",
                }}
              >
                <div className="card-body">
                  <div style={{ fontWeight: 900 }}>Approval required</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    By approving, you confirm that the summaries and gap selections are acceptable for output generation.
                  </div>

                  <div style={{ height: 12 }} />

                  <label className="label" htmlFor="approver_name">Approver name (optional)</label>
                  <input
                    id="approver_name"
                    className="input"
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                    placeholder="e.g., Alex"
                  />

                  <div style={{ height: 12 }} />

                  <label className="row" style={{ alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                      aria-label="I approve the preview"
                    />
                    <span style={{ fontWeight: 800 }}>I approve the preview</span>
                  </label>

                  <div style={{ height: 12 }} />

                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => {
                      if (!confirmChecked) return;
                      actions.setApproval({
                        approved: true,
                        approvedAt: Date.now(),
                        approver: approver.trim(),
                      });
                    }}
                    disabled={!confirmChecked}
                  >
                    Confirm approval
                  </button>

                  {state.approvals.approved ? (
                    <div className="muted" style={{ marginTop: 10 }}>
                      Approved{state.approvals.approver ? ` by ${state.approvals.approver}` : ""}.
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div className="muted">
                You can still edit analysis and gaps by going back; approval will reset on edits.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-nav">
        <button type="button" className="btn" onClick={actions.prevStep}>Back</button>
        <button type="button" className="btn btn-primary" onClick={actions.nextStep} disabled={!state.approvals.approved}>
          Continue to outputs
        </button>
      </div>
    </div>
  );
}

function StepOutputs() {
  const { state, actions, constants } = useWizard();

  useEffect(() => {
    if (state.approvals.approved && (!state.outputs.solutionMd || !state.outputs.presentationMd)) {
      actions.generateOutputs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.approvals.approved]);

  const projectName = state.analysis?.projectContext?.projectName || "solution";

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 900, fontSize: 18 }}>5) Outputs</div>
          <div className="muted">Generated locally. Download markdown files, print to PDF, and preview a lightweight demo dashboard.</div>
        </div>
        <div className="card-body">
          {!state.approvals.approved ? (
            <div className="inline-error" role="alert">
              Outputs are gated behind approval. Go back to Approvals and confirm.
            </div>
          ) : null}

          <OutputExport
            projectName={projectName}
            solutionMd={state.outputs.solutionMd}
            presentationMd={state.outputs.presentationMd}
          />

          <div style={{ height: 12 }} />

          <div className="card print-surface">
            <div className="card-header">
              <div style={{ fontWeight: 800 }}>Solution Document (preview)</div>
              <div className="muted">This preview is printable.</div>
            </div>
            <div className="card-body">
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 13, lineHeight: 1.5 }}>
                {state.outputs.solutionMd || "No output yet."}
              </pre>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <DemoPreview
            projectContext={state.analysis?.projectContext}
            steps={constants.steps}
            activeIndex={state.stepIndex}
          />
        </div>
      </div>

      <div className="footer-nav">
        <button type="button" className="btn" onClick={actions.prevStep}>Back</button>
        <button type="button" className="btn btn-accent" onClick={actions.resetFlow}>
          Reset flow
        </button>
      </div>
    </div>
  );
}

function WizardShell() {
  const { state, actions } = useWizard();

  const progress = useMemo(() => (state.stepIndex + 1) / WIZARD_STEPS.length, [state.stepIndex]);
  const stepName = WIZARD_STEPS[state.stepIndex];

  const sideSummary = useMemo(() => {
    const docCount = state.documents.length;
    const acceptedGaps = (state.gaps || []).filter((g) => g.accepted).length;
    const hasAnalysis = !!state.analysis;
    const approved = !!state.approvals.approved;

    return [
      { title: "Inputs", body: `${docCount} document(s)` },
      { title: "Analysis", body: hasAnalysis ? `Domain: ${state.analysis?.projectContext?.domain || "—"}` : "Not run yet" },
      { title: "Gaps", body: `${acceptedGaps} selected` },
      { title: "Approval", body: approved ? "Approved" : "Not approved" },
      { title: "Outputs", body: state.outputs.solutionMd ? "Generated" : "Not generated" },
    ];
  }, [state.documents.length, state.gaps, state.analysis, state.approvals.approved, state.outputs.solutionMd]);

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand" aria-label="Solution Builder">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <div className="brand-title">Solution Builder</div>
              <div className="brand-subtitle">Offline-first wizard · Black & Yellow</div>
            </div>
          </div>

          <ProgressBar value={progress} label={`${stepName} (${state.stepIndex + 1}/${WIZARD_STEPS.length})`} />

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="btn" onClick={actions.resetFlow}>
              Reset
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 0, paddingBottom: 10 }}>
          <Stepper
            steps={WIZARD_STEPS}
            activeIndex={state.stepIndex}
            onStepClick={(idx) => {
              // Gating: do not allow jumping into Outputs unless approved
              if (WIZARD_STEPS[idx] === "Outputs" && !state.approvals.approved) return;
              actions.setStepIndex(idx);
            }}
          />
        </div>
      </div>

      <div className="container">
        <div className="main-grid">
          <main aria-label="Wizard step content">
            {state.step === "Input" ? <StepInput /> : null}
            {state.step === "Analysis" ? <StepAnalysis /> : null}
            {state.step === "Gaps" ? <StepGaps /> : null}
            {state.step === "Approvals" ? <StepApprovals /> : null}
            {state.step === "Outputs" ? <StepOutputs /> : null}
          </main>

          <aside className="panel no-print" aria-label="Step summary side panel">
            <div className="card">
              <div className="card-header">
                <div style={{ fontWeight: 900 }}>Summary</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Saved locally {state.ui.lastSavedAt ? `· ${new Date(state.ui.lastSavedAt).toLocaleTimeString()}` : ""}
                </div>
              </div>
              <div className="card-body">
                <h4>Step: {state.step}</h4>
                {sideSummary.map((s) => (
                  <div className="summary-item" key={s.title}>
                    <div className="summary-title">{s.title}</div>
                    <div className="summary-body">{s.body}</div>
                  </div>
                ))}

                <hr className="sep" />

                <div className="footer-nav">
                  <button type="button" className="btn" onClick={actions.prevStep} disabled={state.stepIndex === 0}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary" onClick={actions.nextStep} disabled={!state.canGoNext || state.stepIndex === WIZARD_STEPS.length - 1}>
                    Next
                  </button>
                </div>

                {state.step === "Approvals" && !state.approvals.approved ? (
                  <div className="muted" style={{ marginTop: 10 }}>
                    Approval required to proceed to Outputs.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** App entry: wraps the full wizard in the global provider. */
  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}

export default App;
