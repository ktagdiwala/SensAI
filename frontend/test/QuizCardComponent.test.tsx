import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../src/components/QuizCardComponent";

// Mock data
const mockQuestionData: QuestionData = {
  id: "q1",
  description: "What does SQL stand for?",
  choices: [
    { id: "c1", label: "Structured Query Language" },
    { id: "c2", label: "Standard Query Language" },
    { id: "c3", label: "Simple Query Language" },
  ],
  points: 10,
};

const mockValidate = vi.fn();

// Quiz Card Component Tests (Student View)
describe("QuestionCard Component (Student View)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Component displays the question text and all answer options to the student
  it("renders the quiz question and all choices", () => {
    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
      />,
    );

    expect(screen.getByText(mockQuestionData.description)).toBeInTheDocument();
    mockQuestionData.choices.forEach((choice) => {
      expect(screen.getByLabelText(choice.label)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /check|submit|answer/i })).toBeInTheDocument();
  });

  // Clicking submit without selecting an answer prevents validation from being called
  it("prevents submitting without selecting a choice", async () => {
    const user = userEvent.setup();
    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    expect(mockValidate).not.toHaveBeenCalled();
  });

  // Selecting an answer and clicking submit calls the validate function with correct parameters
  it("calls validate when a choice is selected and submitted", async () => {
    const user = userEvent.setup();
    mockValidate.mockResolvedValueOnce({
      correct: true,
      explanation: "Structured Query Language is correct!",
    });

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith({
        questionId: "q1",
        choiceId: "c1",
        studentId: "student123",
      });
    });
  });

  // Feedback explanation from validate is displayed to the student after submission
  it("displays feedback after submission", async () => {
    const user = userEvent.setup();
    mockValidate.mockResolvedValueOnce({
      correct: true,
      explanation: "Structured Query Language is correct!",
    });

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Structured Query Language is correct!"),
      ).toBeInTheDocument();
    });
  });

  // When lockAfterSubmit prop is true, all answer choices become disabled after submission
  it("disables all choices after submission when lockAfterSubmit is true", async () => {
    const user = userEvent.setup();
    mockValidate.mockResolvedValueOnce({
      correct: true,
      explanation: "Correct!",
    });

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
        lockAfterSubmit={true}
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    await waitFor(() => {
      mockQuestionData.choices.forEach((choice) => {
        const input = screen.getByLabelText(choice.label);
        expect(input).toBeDisabled();
      });
    });
  });

  // When lockAfterSubmit prop is false, students can change their answer after submission
  it("allows re-selecting choices when lockAfterSubmit is false", async () => {
    const user = userEvent.setup();
    mockValidate.mockResolvedValueOnce({
      correct: true,
      explanation: "Correct!",
    });

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
        lockAfterSubmit={false}
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    const secondChoice = screen.getByLabelText(mockQuestionData.choices[1].label);
    await user.click(secondChoice);

    expect(secondChoice).toBeChecked();
  });

  // Passing a selected prop pre-checks that answer choice
  it("pre-selects a choice when selected prop is provided", () => {
    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
        selected="c2"
      />,
    );

    const secondChoice = screen.getByLabelText(mockQuestionData.choices[1].label);
    expect(secondChoice).toBeChecked();
  });

  // studentId is included in the validate function call for tracking
  it("includes studentId when calling validate", async () => {
    const user = userEvent.setup();
    mockValidate.mockResolvedValueOnce({
      correct: false,
      explanation: "Not correct. Try again.",
    });

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student456"
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "student456",
          questionId: "q1",
          choiceId: "c1",
        }),
      );
    });
  });

  // Submit button is disabled during the validation process to prevent duplicate submissions
  it("disables submit button while validation is pending", async () => {
    const user = userEvent.setup();
    mockValidate.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ correct: true, explanation: "Correct!" }),
            500,
          ),
        ),
    );

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    const submitButton = screen.getByRole("button", { name: /check|submit|answer/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  // onSelect callback is triggered when a student selects an answer
  it("calls onSelect callback when choice is selected", async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <QuestionCard
        data={mockQuestionData}
        validate={mockValidate}
        studentId="student123"
        onSelect={mockOnSelect}
      />,
    );

    const firstChoice = screen.getByLabelText(mockQuestionData.choices[0].label);
    await user.click(firstChoice);

    expect(mockOnSelect).toHaveBeenCalledWith("c1");
  });
});
