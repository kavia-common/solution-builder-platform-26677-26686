import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { WIZARD_STEPS } from "../theme";
import { loadJSON, saveJSON, clearWizardStorage } from "../utils/storage";
import { analyzeDocuments } from "../utils/analysis";
import { detectGaps } from "../utils/gaps";
import { buildPresentationMarkdown, buildSolutionMarkdown } from "../utils/exports";

const WizardContext = createContext(null);

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const initialState = {
  stepIndex: 0,
  documents: [], // {id, name, type, ext, size, lastModified, text, placeholder, notes}
  analysis: null, // {projectContext, perDoc}
  gaps: [], // {id,title,outline,accepted,details,source}
  approvals: { approved: false, approvedAt: null, approver: "" },
  outputs: { solutionMd: "", presentationMd: "" },
  ui: { isProcessing: false, error: null, lastSavedAt: null },
};

function uuid() {
  // Good-enough offline ID for UI state
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function extFromName(name) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function isAllowedType(file) {
  const ext = extFromName(file.name);
  const allowedExts = ["pdf", "docx", "md", "txt"];
  if (!allowedExts.includes(ext)) return false;

  // Extra mime checks for common cases
  if (ext === "pdf") return file.type === "application/pdf" || file.type === "";
  if (ext === "docx")
    return (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === ""
    );
  if (ext === "txt") return file.type.startsWith("text/") || file.type === "";
  if (ext === "md") return file.type.startsWith("text/") || file.type === "";
  return false;
}

async function fileToDocument(file) {
  const ext = extFromName(file.name);
  const base = {
    id: uuid(),
    name: file.name,
    type: file.type || `application/${ext || "octet-stream"}`,
    ext,
    size: file.size,
    lastModified: file.lastModified,
    text: "",
    placeholder: "",
    notes: "",
  };

  // Parse only metadata; text for txt/md; placeholders for pdf/docx
  if (ext === "txt" || ext === "md") {
    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsText(file);
    });

    return { ...base, text };
  }

  return {
    ...base,
    placeholder:
      ext === "pdf"
        ? "[Simulated extraction: PDF text not parsed offline in this demo.]"
        : "[Simulated extraction: DOCX text not parsed offline in this demo.]",
    text: "",
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, stepIndex: action.stepIndex };
    case "SET_ERROR":
      return { ...state, ui: { ...state.ui, error: action.error } };
    case "SET_PROCESSING":
      return { ...state, ui: { ...state.ui, isProcessing: action.isProcessing } };
    case "ADD_DOCUMENTS":
      return {
        ...state,
        documents: [...state.documents, ...action.documents],
        // moving forward invalidates downstream state
        analysis: null,
        gaps: [],
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "REMOVE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.filter((d) => d.id !== action.id),
        analysis: null,
        gaps: [],
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "UPDATE_DOC_NOTES":
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.id ? { ...d, notes: action.notes } : d
        ),
      };
    case "SET_ANALYSIS":
      return { ...state, analysis: action.analysis };
    case "UPDATE_ANALYSIS_DOC":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          perDoc: (state.analysis?.perDoc || []).map((a) =>
            a.id === action.id ? { ...a, ...action.patch } : a
          ),
        },
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "UPDATE_PROJECT_CONTEXT":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          projectContext: { ...state.analysis?.projectContext, ...action.patch },
        },
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "SET_GAPS":
      return { ...state, gaps: action.gaps };
    case "UPDATE_GAP":
      return {
        ...state,
        gaps: state.gaps.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "ADD_MANUAL_GAP":
      return {
        ...state,
        gaps: [
          ...state.gaps,
          {
            id: `manual_${uuid()}`,
            title: action.title,
            outline: action.outline || [],
            accepted: true,
            details: "",
            source: "manual",
          },
        ],
        approvals: { approved: false, approvedAt: null, approver: "" },
        outputs: { solutionMd: "", presentationMd: "" },
      };
    case "SET_APPROVAL":
      return { ...state, approvals: action.approvals };
    case "SET_OUTPUTS":
      return { ...state, outputs: action.outputs };
    case "RESET_FLOW":
      clearWizardStorage();
      return { ...initialState };
    case "HYDRATE":
      return { ...state, ...action.state };
    case "MARK_SAVED":
      return { ...state, ui: { ...state.ui, lastSavedAt: Date.now() } };
    default:
      return state;
  }
}

// PUBLIC_INTERFACE
export function WizardProvider({ children }) {
  /** Provides wizard state + offline-first actions to the app. */
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate once
  useEffect(() => {
    const hydrated = loadJSON("state", null);
    if (hydrated) dispatch({ type: "HYDRATE", state: hydrated });
  }, []);

  // Persist on change (throttled by effect batching; OK for this scale)
  useEffect(() => {
    saveJSON("state", state);
    dispatch({ type: "MARK_SAVED" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex, state.documents, state.analysis, state.gaps, state.approvals, state.outputs]);

  const canGoNext = useMemo(() => {
    const step = WIZARD_STEPS[state.stepIndex];
    if (step === "Input") return state.documents.length > 0;
    if (step === "Approvals") return state.approvals.approved;
    return true;
  }, [state.stepIndex, state.documents.length, state.approvals.approved]);

  const step = WIZARD_STEPS[state.stepIndex];

  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      async addFiles(files) {
        /** Validate and ingest uploaded files; parse TXT/MD; simulate others. */
        dispatch({ type: "SET_ERROR", error: null });

        const list = Array.from(files || []);
        if (!list.length) return;

        const errors = [];
        const valid = [];

        list.forEach((f) => {
          if (!isAllowedType(f)) errors.push(`${f.name}: unsupported file type`);
          else if (f.size > MAX_FILE_BYTES) errors.push(`${f.name}: exceeds 10MB limit`);
          else valid.push(f);
        });

        if (errors.length) {
          dispatch({ type: "SET_ERROR", error: errors.join("; ") });
        }
        if (!valid.length) return;

        dispatch({ type: "SET_PROCESSING", isProcessing: true });
        try {
          const docs = [];
          for (const f of valid) {
            // eslint-disable-next-line no-await-in-loop
            docs.push(await fileToDocument(f));
          }
          dispatch({ type: "ADD_DOCUMENTS", documents: docs });
        } catch (e) {
          dispatch({ type: "SET_ERROR", error: e?.message || "Failed to add files." });
        } finally {
          dispatch({ type: "SET_PROCESSING", isProcessing: false });
        }
      },

      // PUBLIC_INTERFACE
      removeDocument(id) {
        /** Remove an uploaded document by id. */
        dispatch({ type: "REMOVE_DOCUMENT", id });
      },

      // PUBLIC_INTERFACE
      setStepIndex(stepIndex) {
        /** Set current wizard step (bounded). */
        const next = Math.max(0, Math.min(WIZARD_STEPS.length - 1, stepIndex));
        dispatch({ type: "SET_STEP", stepIndex: next });
      },

      // PUBLIC_INTERFACE
      nextStep() {
        /** Move to next step (respects gating). */
        if (!canGoNext) return;
        dispatch({ type: "SET_STEP", stepIndex: Math.min(state.stepIndex + 1, WIZARD_STEPS.length - 1) });
      },

      // PUBLIC_INTERFACE
      prevStep() {
        /** Move to previous step. */
        dispatch({ type: "SET_STEP", stepIndex: Math.max(0, state.stepIndex - 1) });
      },

      // PUBLIC_INTERFACE
      async runAnalysis() {
        /** Run mock analysis locally; simulate latency and set analysis state. */
        dispatch({ type: "SET_ERROR", error: null });
        dispatch({ type: "SET_PROCESSING", isProcessing: true });
        try {
          await new Promise((r) => setTimeout(r, 600));
          const analysis = analyzeDocuments(state.documents);
          dispatch({ type: "SET_ANALYSIS", analysis });

          // Generate gap suggestions right after analysis
          const gaps = detectGaps({ documents: state.documents, analysis });
          dispatch({ type: "SET_GAPS", gaps });
        } catch (e) {
          dispatch({ type: "SET_ERROR", error: e?.message || "Analysis failed." });
        } finally {
          dispatch({ type: "SET_PROCESSING", isProcessing: false });
        }
      },

      // PUBLIC_INTERFACE
      updateAnalysisDoc(id, patch) {
        /** Update analysis document fields (title/summary/keyPoints/notes). */
        dispatch({ type: "UPDATE_ANALYSIS_DOC", id, patch });
      },

      // PUBLIC_INTERFACE
      updateProjectContext(patch) {
        /** Update aggregate project context fields. */
        dispatch({ type: "UPDATE_PROJECT_CONTEXT", patch });
      },

      // PUBLIC_INTERFACE
      setGaps(gaps) {
        /** Replace gaps list. */
        dispatch({ type: "SET_GAPS", gaps });
      },

      // PUBLIC_INTERFACE
      updateGap(id, patch) {
        /** Patch a gap entry (accept/reject/details/title). */
        dispatch({ type: "UPDATE_GAP", id, patch });
      },

      // PUBLIC_INTERFACE
      addManualGap({ title, outline }) {
        /** Add a manual gap suggestion. */
        dispatch({ type: "ADD_MANUAL_GAP", title, outline });
      },

      // PUBLIC_INTERFACE
      setApproval(approvals) {
        /** Set approval state. */
        dispatch({ type: "SET_APPROVAL", approvals });
      },

      // PUBLIC_INTERFACE
      generateOutputs() {
        /** Generate solution doc + presentation outline locally and store them. */
        const projectContext = state.analysis?.projectContext || {};
        const solutionMd = buildSolutionMarkdown({
          projectContext,
          documents: state.documents,
          analysis: state.analysis,
          gaps: state.gaps,
        });
        const presentationMd = buildPresentationMarkdown({
          projectContext,
          analysis: state.analysis,
          gaps: state.gaps,
        });

        dispatch({ type: "SET_OUTPUTS", outputs: { solutionMd, presentationMd } });
      },

      // PUBLIC_INTERFACE
      resetFlow() {
        /** Reset the entire wizard flow and clear persisted state. */
        dispatch({ type: "RESET_FLOW" });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex, state.documents, state.analysis, state.gaps, state.approvals, state.outputs, canGoNext]);

  const value = useMemo(
    () => ({
      state: {
        ...state,
        step,
        canGoNext,
      },
      actions,
      constants: { steps: WIZARD_STEPS, maxFileBytes: MAX_FILE_BYTES },
    }),
    [state, actions, step, canGoNext]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

// PUBLIC_INTERFACE
export function useWizard() {
  /** Access wizard state/actions. */
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
