import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Sample test demonstrating the component testing pattern.
 * This verifies the test framework is set up correctly.
 */

function SampleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}

describe("Test Framework Verification", () => {
  it("renders a component and finds text", () => {
    render(<SampleButton label="Click me" onClick={() => {}} />);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles user interactions", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<SampleButton label="Submit" onClick={() => { clicked = true; }} />);

    await user.click(screen.getByText("Submit"));
    expect(clicked).toBe(true);
  });

  it("uses jest-dom matchers", () => {
    render(<SampleButton label="Test" onClick={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toBeVisible();
    expect(button).toHaveTextContent("Test");
  });
});
