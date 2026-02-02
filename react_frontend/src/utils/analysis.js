/**
 * Offline mock analysis heuristics.
 */

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function firstNonEmptyLines(text, maxLines) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(0, maxLines);
}

function keywordMatchScore(haystack, keywords) {
  const h = String(haystack || "").toLowerCase();
  return keywords.reduce((acc, k) => acc + (h.includes(k) ? 1 : 0), 0);
}

function guessSummaryFromName(filename) {
  const base = filename.replace(/\.[^/.]+$/, "");
  const nice = base
    .replace(/[_-]+/g, " ")
    .replace(/\b(prd|sow|arch|architecture|notes|reqs)\b/gi, (m) => m.toUpperCase())
    .trim();

  const hints = [];
  const lc = filename.toLowerCase();
  if (lc.includes("prd")) hints.push("product requirements");
  if (lc.includes("sow")) hints.push("scope and deliverables");
  if (lc.includes("arch")) hints.push("architecture overview");
  if (lc.includes("risk")) hints.push("risks/assumptions");
  if (lc.includes("test")) hints.push("testing strategy");

  return `This document (“${nice}”) appears to cover ${hints.length ? hints.join(", ") : "project context and planning details"}.`;
}

function extractEntities(text) {
  const t = String(text || "");
  const entities = new Set();

  // Simple token/phrase based entity “detection”
  const common = [
    "API",
    "UI",
    "Frontend",
    "Backend",
    "Database",
    "Auth",
    "SSO",
    "SLA",
    "SOC2",
    "HIPAA",
    "GDPR",
    "KPI",
    "CI/CD",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Supabase",
    "Postgres",
    "Redis",
    "React",
    "Node",
  ];

  common.forEach((c) => {
    if (t.toLowerCase().includes(c.toLowerCase())) entities.add(c);
  });

  // Capitalized words (very naive)
  const caps = t.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || [];
  caps.slice(0, 25).forEach((w) => entities.add(w));

  return Array.from(entities).slice(0, 18);
}

// PUBLIC_INTERFACE
export function analyzeDocuments(documents) {
  /** Generate per-document analysis plus aggregated context. */
  const perDoc = documents.map((doc) => {
    const text = doc.text || "";
    const isTextLike = doc.type.includes("text") || doc.ext === "md";
    const previewLines = isTextLike ? firstNonEmptyLines(text, 6) : [];
    const summary = isTextLike
      ? (previewLines.length
          ? `Summary from first lines:\n- ${previewLines.join("\n- ")}`
          : "No readable text found; please add notes in the editor.")
      : guessSummaryFromName(doc.name);

    const keyPoints = isTextLike
      ? firstNonEmptyLines(text, 12).slice(0, 6).map((l) => l.replace(/^[-*]\s*/, ""))
      : [
          "Document is a binary format; content extraction is simulated offline.",
          "Use the editor below to add or correct key points.",
        ];

    const title =
      doc.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || doc.name;

    const entities = extractEntities(`${doc.name}\n${text}`);

    return {
      id: doc.id,
      title,
      summary,
      keyPoints,
      entities,
      notes: doc.notes || "",
    };
  });

  const combined = `${documents.map((d) => d.name).join("\n")}\n\n${documents
    .map((d) => d.text || "")
    .join("\n\n")}`;

  const domainScores = [
    {
      domain: "Web Application",
      score:
        keywordMatchScore(combined, ["react", "frontend", "browser", "ui", "web"]) +
        keywordMatchScore(combined, ["api", "backend", "node", "graphql", "rest"]),
    },
    {
      domain: "Infrastructure / Platform",
      score: keywordMatchScore(combined, [
        "kubernetes",
        "docker",
        "terraform",
        "helm",
        "aws",
        "gcp",
        "azure",
        "ci/cd",
      ]),
    },
    {
      domain: "Data / Analytics",
      score: keywordMatchScore(combined, [
        "warehouse",
        "etl",
        "pipeline",
        "metrics",
        "kpi",
        "dashboard",
        "analytics",
      ]),
    },
  ].sort((a, b) => b.score - a.score);

  const detectedDomain = domainScores[0].score ? domainScores[0].domain : "General Software";

  const themes = [
    { label: "Requirements", score: keywordMatchScore(combined, ["requirement", "must", "shall", "acceptance"]) },
    { label: "Architecture", score: keywordMatchScore(combined, ["architecture", "component", "service", "data flow"]) },
    { label: "Security", score: keywordMatchScore(combined, ["security", "auth", "oauth", "sso", "encryption"]) },
    { label: "Operations", score: keywordMatchScore(combined, ["deploy", "monitor", "alert", "logging", "sla"]) },
    { label: "Testing", score: keywordMatchScore(combined, ["test", "qa", "validation", "unit", "integration"]) },
  ]
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((t) => t.label);

  const entities = Array.from(
    new Set(perDoc.flatMap((d) => d.entities || []))
  ).slice(0, 14);

  const projectName =
    documents[0]?.name ? documents[0].name.replace(/\.[^/.]+$/, "") : "Solution Builder Project";

  return {
    projectContext: {
      id: slugify(projectName) || "project",
      projectName,
      domain: detectedDomain,
      themes,
      entities,
      notes: "",
    },
    perDoc,
  };
}
