/**
 * Black & Yellow theme helper utilities.
 *
 * This file exports the theme tokens used by the UI, plus the wizard step labels.
 */

export const theme = {
  name: "BlackYellow",
  colors: {
    // Suggested tokens from the task request
    primary: "#FACC15", // yellow
    secondary: "#F59E0B", // amber
    success: "#22C55E",
    error: "#EF4444",

    background: "#0A0A0A",
    surface: "#111111",
    text: "#F5F5F5",
  },
};

export const WIZARD_STEPS = ["Input", "Analysis", "Gaps", "Approvals", "Outputs"];
