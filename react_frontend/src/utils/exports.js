/**
 * Offline export utilities (download .md/.txt).
 */

function safeFileName(name) {
  return String(name || "export")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

// PUBLIC_INTERFACE
export function downloadTextFile({ filename, content, mime = "text/plain;charset=utf-8" }) {
  /** Trigger a client-side download for a text content. */
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// PUBLIC_INTERFACE
export function buildSolutionMarkdown({ projectContext, documents, analysis, gaps }) {
  /** Build a structured Solution Document markdown from wizard state. */
  const acceptedGaps = (gaps || []).filter((g) => g.accepted);

  const execSummary = [
    `Project: **${projectContext?.projectName || "Untitled Project"}**`,
    `Detected domain: **${projectContext?.domain || "General Software"}**`,
    projectContext?.themes?.length ? `Themes: ${projectContext.themes.map((t) => `\`${t}\``).join(", ")}` : null,
    projectContext?.entities?.length ? `Entities: ${projectContext.entities.map((e) => `\`${e}\``).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const inputList = (documents || [])
    .map((d) => `- **${d.name}** (${d.ext?.toUpperCase() || d.type}, ${Math.round(d.size / 1024)} KB)`)
    .join("\n");

  const perDoc = (analysis?.perDoc || [])
    .map(
      (a) => `### ${a.title}\n\n**Summary**\n\n${a.summary}\n\n**Key Points**\n${(a.keyPoints || []).map((k) => `- ${k}`).join("\n")}\n\n**Notes/Corrections**\n${a.notes || "_None_"}\n`
    )
    .join("\n");

  const gapSection = acceptedGaps.length
    ? acceptedGaps
        .map(
          (g) =>
            `### ${g.title}\n\n**Suggested outline**\n${(g.outline || []).map((o) => `- ${o}`).join("\n")}\n\n**Resolution notes**\n${g.details || "_TBD_"}\n`
        )
        .join("\n")
    : "_No gaps selected._";

  const timeline = `- Week 1: Confirm scope, requirements, and architecture baseline\n- Week 2: Implement core components + integrations\n- Week 3: Hardening (NFRs), testing, and deployment readiness\n- Week 4: UAT, launch, and operations handoff`;

  return `# Structured Solution Document

## Executive Summary
${execSummary}

## Scope
${acceptedGaps.find((g) => g.id === "reqs") ? "Scope refined via gap-driven requirements capture." : "Scope derived from provided inputs."}

## Architecture Overview
A pragmatic architecture aligned to the detected domain and project themes. This document is generated offline using client-side heuristics.

## Components
- UI / Frontend
- API / Services
- Data store
- Observability
- CI/CD

## Data Flows
${acceptedGaps.find((g) => g.id === "dataflows") ? "Data flows require refinement; see Gaps & Resolutions." : "Key data flows are inferred from inputs."}

## Non-Functional Requirements
${acceptedGaps.find((g) => g.id === "nfr") ? "NFRs need explicit targets; see Gaps & Resolutions." : "NFRs summarized from available inputs."}

## Risks & Mitigations
${acceptedGaps.find((g) => g.id === "risks") ? "Risks require explicit capture; see Gaps & Resolutions." : "Risks inferred from inputs."}

## Testing & Validation
${acceptedGaps.find((g) => g.id === "testing") ? "Testing strategy to be detailed; see Gaps & Resolutions." : "Testing strategy inferred from inputs."}

## Deployment & Operations
${acceptedGaps.find((g) => g.id === "deployment") ? "Operations plan to be detailed; see Gaps & Resolutions." : "Deployment plan inferred from inputs."}

## Timeline
${timeline}

---

## Inputs
${inputList || "_No inputs uploaded._"}

---

## Analysis
${perDoc || "_No analysis available._"}

---

## Gaps & Resolutions
${gapSection}
`;
}

// PUBLIC_INTERFACE
export function buildPresentationMarkdown({ projectContext, analysis, gaps }) {
  /** Build a client-ready presentation outline (markdown). */
  const acceptedGaps = (gaps || []).filter((g) => g.accepted);
  const themes = projectContext?.themes?.length ? projectContext.themes.join(", ") : "N/A";

  const slides = [
    { title: "1. Executive Summary", bullets: [`Project: ${projectContext?.projectName || "Untitled"}`, `Domain: ${projectContext?.domain || "General Software"}`, `Themes: ${themes}`] },
    { title: "2. Current Understanding", bullets: ["Key documents analyzed offline", "Summaries and key points reviewed/edited by user"] },
    { title: "3. Proposed Architecture", bullets: ["High-level components", "Data flows (placeholder)", "Security & compliance considerations"] },
    { title: "4. Identified Gaps", bullets: acceptedGaps.length ? acceptedGaps.map((g) => g.title) : ["No gaps selected"] },
    { title: "5. Plan & Timeline", bullets: ["Scope finalization", "Implementation iterations", "Testing, deployment, and operations handoff"] },
  ];

  return `# Client-ready Presentation Outline

${slides
  .map((s) => `## ${s.title}\n${s.bullets.map((b) => `- ${b}`).join("\n")}\n`)
  .join("\n")}

---

## Appendix: Key Points (for speaker notes)
${(analysis?.perDoc || [])
  .map((a) => `### ${a.title}\n${(a.keyPoints || []).map((k) => `- ${k}`).join("\n")}\n`)
  .join("\n")}
`;
}

// PUBLIC_INTERFACE
export function defaultExportFilenames(projectName) {
  /** Suggest stable filenames for exports. */
  const base = safeFileName(projectName || "solution");
  return {
    solutionMd: `${base}_solution.md`,
    deckMd: `${base}_presentation.md`,
    deckTxt: `${base}_presentation.txt`,
  };
}
