import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the wizard shell", () => {
  render(<App />);
  expect(screen.getByText(/Solution Builder/i)).toBeInTheDocument();
  expect(screen.getByText(/Input/i)).toBeInTheDocument();
});
