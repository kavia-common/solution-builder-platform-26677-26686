import React, { useMemo } from "react";

// PUBLIC_INTERFACE
export default function DemoPreview({ projectContext, steps, activeIndex }) {
  /** Lightweight interactive demo preview dashboard (offline). */
  const kpis = useMemo(() => {
    const themes = projectContext?.themes?.length || 0;
    const entities = projectContext?.entities?.length || 0;
    const domain = projectContext?.domain || "General Software";
    return [
      { label: "Detected domain", value: domain },
      { label: "Themes", value: `${themes}` },
      { label: "Entities", value: `${entities}` },
    ];
  }, [projectContext]);

  const flowItems = useMemo(() => {
    const list = projectContext?.themes?.length ? projectContext.themes : ["Input", "Analysis", "Gaps"];
    return list.slice(0, 6);
  }, [projectContext]);

  return (
    <div className="demo print-surface">
      <div className="demo-hero">
        <div>
          <div className="badge badge-primary">Interactive demo preview</div>
          <h3 style={{ margin: "10px 0 0" }}>{projectContext?.projectName || "Project Dashboard"}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            A simulated dashboard layout populated from aggregated context. No backend calls.
          </div>
        </div>
      </div>

      <div className="demo-grid">
        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 800 }}>KPIs</div>
          </div>
          <div className="card-body">
            <div className="kpi-grid">
              {kpis.map((k) => (
                <div key={k.label} className="kpi">
                  <div className="muted" style={{ fontSize: 12 }}>{k.label}</div>
                  <div style={{ fontWeight: 900, marginTop: 4 }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 800 }}>Flow diagram (placeholder)</div>
          </div>
          <div className="card-body">
            <div className="flow">
              {flowItems.map((f, idx) => (
                <div key={`${f}_${idx}`} className="flow-node">
                  <div className="flow-dot" aria-hidden="true" />
                  <div>
                    <div style={{ fontWeight: 800 }}>{f}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Simulated interaction node</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ fontWeight: 800 }}>Wizard stepper (preview)</div>
          </div>
          <div className="card-body">
            <ol className="demo-stepper" aria-label="Preview stepper">
              {(steps || []).map((s, idx) => (
                <li key={s} className={`demo-step ${idx === activeIndex ? "active" : ""}`}>
                  <span className="demo-step-num">{idx + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
