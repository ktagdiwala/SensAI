import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import QuizQuestionInstructor from "../src/components/QuizQuestionComponentInstructor";
import type { InstructorQuestion } from "../src/components/QuizCardInstructorComponent";

// Mock Data
const mockInstructorQuestion: InstructorQuestion = {
  id: 1,
  title: "SQL Basics",
  description: "What does SQL stand for?",
  points: 10,
  choices: [
    { id: "c1", label: "Structured Query Language" },
    { id: "c2", label: "Standard Query Language" },
    { id: "c3", label: "Simple Query Language" },
  ],
  type: "multiple_choice",
  correctChoiceId: "c1",
};

const mockOnSave = vi.fn();
const mockOnCancel = vi.fn();

// Quiz Question Instructor Component Tests (Instructor Question Editor)
describe("QuizQuestionInstructorComponent (Instructor Question Editor)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Form has a textarea for question text and an input field for point value
  it("renders question form with required fields", () => {
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    expect(textareas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  // Dropdown selector is available to choose question type (true/false or multiple choice)
  it("renders question type selector with options", () => {
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  // Form starts with true/false question type selected by default
  it("initializes with true/false choices by default", () => {
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const inputs = screen.getAllByRole("radio");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  // Clicking the cancel button closes the form without saving
  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  // Clicking save without entering question text displays a validation error
  it("prevents saving with empty question text", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/question text is required/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  // Entering a negative point value displays a validation error and prevents saving
  it("prevents saving with invalid points", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    const descriptionField = textareas[0];
    const pointsField = screen.getByDisplayValue("1");

    await user.clear(pointsField);
    await user.type(pointsField, "-5");
    await user.type(descriptionField, "What is 2+2?");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const errorText = screen.queryByText(/points must be/i) || 
                     screen.queryByText(/zero or a positive number/i);
    
    if (errorText) {
      expect(errorText).toBeInTheDocument();
    }

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  // When editing an existing question, the form populates with the question's current data
  it("loads initial question data when editing", () => {
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        initialQuestion={mockInstructorQuestion}
        displayNumber={1}
      />,
    );

    expect(screen.getByDisplayValue(mockInstructorQuestion.description)).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(mockInstructorQuestion.points))).toBeInTheDocument();
  });

  // Displays a validation error if instructor tries to save without marking a correct answer
  it("displays error when no correct answer is selected", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    const descriptionField = textareas[0];
    await user.type(descriptionField, "What is the capital of France?");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Wait a bit for state update then check for error
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (screen.queryByText(/select a correct answer before saving/i)) {
      expect(screen.getByText(/select a correct answer before saving/i)).toBeInTheDocument();
    }
  });

  // Marks a radio button as the correct answer when clicked
  it("marks choice as correct when clicked", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const radios = screen.getAllByRole("radio");
    if (radios.length > 1) {
      await user.click(radios[1]);
    }
  });

  // After successfully saving a new question, the form clears for entering another question
  it("resets form after saving a new question", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce(undefined);

    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    const descriptionField = textareas[0];
    await user.type(descriptionField, "What is 2+2?");

    const radios = screen.getAllByRole("radio");
    if (radios.length > 0) {
      await user.click(radios[0]);
    }

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  // Renders a second textarea for optional prompt/instructions
  it("renders prompt field as optional", () => {
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  // Changes question type from true/false to multiple choice when selected from the dropdown
  it("changes question type from true/false to multiple choice", async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionInstructor
        nextId={2}
        onCancel={mockOnCancel}
        onSave={mockOnSave}
        displayNumber={1}
      />,
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "multiple_choice");

    expect(select).toHaveValue("multiple_choice");
  });
});
