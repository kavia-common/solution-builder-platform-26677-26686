/**
 * Offline “gap detection” heuristics for typical solution docs.
 */

function includesAny(haystack, needles) {
  const h = String(haystack || "").toLowerCase();
  return needles.some((n) => h.includes(n));
}

const GAP_CATALOG = [
  {
    id: "reqs",
    title: "Clear functional requirements",
    outline: ["User personas and goals", "In-scope / out-of-scope", "Acceptance criteria per feature"],
    keywords: ["requirement", "acceptance", "user story", "shall", "must"],
  },
  {
    id: "nfr",
    title: "Non-functional requirements",
    outline: ["Performance targets", "Availability/SLA", "Security & compliance", "Accessibility"],
    keywords: ["sla", "availability", "performance", "security", "compliance", "accessibility"],
  },
  {
    id: "dataflows",
    title: "Data flows & integrations",
    outline: ["Key flows (happy path)", "Edge cases", "External systems", "Data retention/privacy"],
    keywords: ["data flow", "integration", "webhook", "api", "etl"],
  },
  {
    id: "testing",
    title: "Testing & validation plan",
    outline: ["Unit & integration testing", "UAT plan", "Test data strategy", "Success criteria"],
    keywords: ["test", "qa", "validation", "uat"],
  },
  {
    id: "deployment",
    title: "Deployment & operations",
    outline: ["Environments", "CI/CD approach", "Observability (logs/metrics/traces)", "Runbooks"],
    keywords: ["deploy", "deployment", "ci/cd", "monitor", "alert", "runbook", "observability"],
  },
  {
    id: "risks",
    title: "Risks & mitigations",
    outline: ["Key risks", "Mitigations", "Open questions", "Assumptions/constraints"],
    keywords: ["risk", "mitigation", "assumption", "constraint"],
  },
  {
    id: "metrics",
    title: "Metrics & success measurement",
    outline: ["KPIs", "Dashboards", "Instrumentation plan", "Ongoing optimization"],
    keywords: ["kpi", "metric", "dashboard", "instrumentation"],
  },
];

// PUBLIC_INTERFACE
export function detectGaps({ documents, analysis }) {
  /** Detect missing sections using filenames + available text + analysis notes. */
  const combined =
    `${documents.map((d) => d.name).join("\n")}\n\n${documents.map((d) => d.text || "").join("\n\n")}\n\n` +
    `${analysis?.perDoc?.map((a) => `${a.summary}\n${(a.keyPoints || []).join("\n")}\n${a.notes || ""}`).join("\n\n") || ""}`;

  const suggestions = GAP_CATALOG.map((g) => {
    const present = includesAny(combined, g.keywords);
    return {
      id: g.id,
      title: g.title,
      outline: g.outline,
      present,
      accepted: !present, // auto-accept missing ones
      details: "",
      source: "auto",
    };
  }).filter((g) => !g.present);

  return suggestions;
}
