import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import QuizCardInstructor, {
  type InstructorQuestion,
} from "../src/components/QuizCardInstructorComponent";

// Mock data
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

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

// Quiz Card Instructor Component Tests (Instructor View)
describe("QuizCardInstructorComponent (Instructor View)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Question heading, description text, and point value display correctly
  it("renders instructor question with title and description", () => {
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText(mockInstructorQuestion.description)).toBeInTheDocument();
    expect(screen.getByText("10 pts")).toBeInTheDocument();
  });

  // All available answer options are displayed for the question
  it("renders all answer choices", () => {
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    mockInstructorQuestion.choices.forEach((choice) => {
      expect(screen.getByText(choice.label)).toBeInTheDocument();
    });
  });

  // Correct answer is marked/checked and visible to the instructor
  it("marks the correct choice as checked", () => {
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
  });

  // Clicking the edit button triggers the onEdit callback with the question data
  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const editButton = screen.getByLabelText("Edit question");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockInstructorQuestion);
  });

  // Clicking the delete button triggers the onDelete callback with the question ID
  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByLabelText("Delete question");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockInstructorQuestion.id);
  });

  // When no position is provided, the question title is used as the heading instead of a number
  it("uses question title as heading when position is not provided", () => {
    const questionWithTitle = { ...mockInstructorQuestion, title: "Custom Title" };
    render(
      <QuizCardInstructor
        question={questionWithTitle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  // All answer choice inputs are disabled so instructors cannot modify them from this view
  it("disables all choice inputs (instructor cannot select)", () => {
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const inputs = screen.getAllByRole("radio");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  // true/false questions display both True and False as answer options
  it("renders true/false question correctly", () => {
    const trueFalseQuestion: InstructorQuestion = {
      ...mockInstructorQuestion,
      type: "true_false",
      choices: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
    };

    render(
      <QuizCardInstructor
        question={trueFalseQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  // Number of radio button options matches the number of answer choices
  it("displays correct number of answer options", () => {
    render(
      <QuizCardInstructor
        question={mockInstructorQuestion}
        position={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(mockInstructorQuestion.choices.length);
  });
});
