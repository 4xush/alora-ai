import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Card,
  Radio,
  Button,
  Typography,
  Progress,
  Space,
  Alert,
  Spin,
  Tag,
  Divider,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  pauseInterview,
  resumeInterview,
  setError,
  clearError,
  nextQuestion,
} from "../../store/intervieweeSlice.js";
import { store } from "../../store/store.js";

const { Title, Text, Paragraph } = Typography;

const MCQTest = ({ onAnswer }) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    questions,
    currentQuestionIndex,
    answers,
    paused,
    inProgress,
    loading,
    error,
  } = useSelector((state) => state.interviewee);

  // Local state
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // Refs to track current state and prevent race conditions
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const isSubmittingRef = useRef(false);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );

  // Force component re-render when question index changes
  const questionKey = useMemo(() => {
    return `${currentQuestionIndex}-${currentQuestion?.id || "no-question"}`;
  }, [currentQuestionIndex, currentQuestion?.id]);

  // Update refs when Redux state changes
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // Handle answer submission - defining this FIRST before it is used in handleTimeUp
  const handleSubmitAnswer = useCallback(
    async (isTimeUp = false) => {
      // Use refs to get the most current state
      const currentIndex = currentQuestionIndexRef.current;
      const currentQ = questions[currentIndex];
      const isCurrentlySubmitting = isSubmittingRef.current;

      if (isCurrentlySubmitting || !currentQ) {
        console.log("MCQTest: Submit blocked", {
          isSubmitting: isCurrentlySubmitting,
          hasCurrentQuestion: !!currentQ,
          currentIndex,
          questionKey,
        });
        return;
      }

      console.log("MCQTest: Submitting answer", {
        currentQuestionIndex: currentIndex,
        questionId: currentQ.id,
        selectedOption,
        isTimeUp,
        isLastQuestion: currentIndex === questions.length - 1,
        questionsTotal: questions.length,
      });

      setIsSubmitting(true);
      isSubmittingRef.current = true;

      try {
        const secondsSpent = questionStartTime
          ? Math.round((Date.now() - questionStartTime) / 1000)
          : (currentQ.seconds || 30) - timeRemaining;

        const answerData = {
          questionId: currentQ.id,
          answer: selectedOption || "", // Empty string if no selection
          secondsSpent,
          isLast: currentIndex === questions.length - 1,
          isMultipleChoice: true,
          options: currentQ.options,
          correctAnswer: currentQ.correctAnswer,
          wasTimeUp: isTimeUp,
        };

        console.log("MCQTest: Calling onAnswer with data", answerData);

        // Call the parent's onAnswer handler
        if (onAnswer) {
          await onAnswer(answerData);
          console.log("MCQTest: onAnswer completed successfully");

          // If this is the last question, don't expect component to update further
          if (answerData.isLast) {
            console.log(
              "MCQTest: Last question submitted, interview will complete"
            );
          } else {
            // Only for non-final questions, check state updates
            setTimeout(() => {
              console.log("MCQTest: Post-answer state check", {
                currentQuestionIndex,
                questionsLength: questions.length,
                shouldHaveAdvanced: !answerData.isLast,
              });
            }, 200);
          }
        } else {
          console.error("MCQTest: No onAnswer handler provided!");
        }
      } catch (error) {
        console.error("MCQTest: Failed to submit answer:", error);
        dispatch(setError("Failed to submit answer. Please try again."));
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    },
    [
      selectedOption,
      questionStartTime,
      timeRemaining,
      onAnswer,
      dispatch,
      questions,
    ]
  );

  // Handle time up (auto-submit)
  const handleTimeUp = useCallback(async () => {
    if (isSubmittingRef.current) {
      console.log("MCQTest: Time up but already submitting, skipping");
      return;
    }

    const currentIndex = currentQuestionIndexRef.current;
    const currentQ = questions[currentIndex];

    if (!currentQ) {
      console.log("MCQTest: Time up but no current question, skipping");
      return;
    }

    console.log("MCQTest: Time up, auto-submitting answer", {
      currentIndex,
      questionId: currentQ.id,
    });

    // Submit with no answer or current selection
    await handleSubmitAnswer(true);
  }, [questions, handleSubmitAnswer]);

  // Monitor currentQuestionIndex changes specifically
  useEffect(() => {
    console.log("MCQTest: currentQuestionIndex changed", {
      oldIndex: "tracked in effect",
      newIndex: currentQuestionIndex,
      totalQuestions: questions.length,
      currentQuestionId: currentQuestion?.id,
      currentQuestionText: currentQuestion?.text?.substring(0, 50),
    });
  }, [currentQuestionIndex, questions.length, currentQuestion?.id]);

  // Direct Redux store subscription for debugging
  useEffect(() => {
    // Get the current interview status
    const currentStatus = store.getState().interviewee.status;

    // Don't set up subscription if the interview is already completed or not in progress
    if (currentStatus === "completed" || !inProgress) {
      console.log("MCQTest: Not setting up subscription", {
        completed: currentStatus === "completed",
        inProgress,
      });
      return;
    }

    console.log("MCQTest: Setting up Redux store subscription");

    let isComponentMounted = true;
    const unsubscribe = store.subscribe(() => {
      // If component is unmounted, don't process updates
      if (!isComponentMounted) return;

      const state = store.getState();
      const interviewStatus = state.interviewee.status;

      // Immediately return if interview is completed or no longer in progress
      if (interviewStatus === "completed" || !state.interviewee.inProgress) {
        console.log(
          "MCQTest: Skipping store update - interview completed or not in progress"
        );
        return;
      }

      const reduxQuestionIndex = state.interviewee.currentQuestionIndex;
      const reduxQuestionsLength = state.interviewee.questions.length;

      console.log("MCQTest: Redux store changed", {
        reduxCurrentQuestionIndex: reduxQuestionIndex,
        componentCurrentQuestionIndex: currentQuestionIndex,
        reduxQuestionsLength,
        componentQuestionsLength: questions.length,
        stateSync: reduxQuestionIndex === currentQuestionIndex,
        interviewStatus,
      });

      // Check if there's a mismatch (but only log it, don't force update)
      if (reduxQuestionIndex !== currentQuestionIndex) {
        console.warn("MCQTest: State mismatch detected!", {
          redux: reduxQuestionIndex,
          component: currentQuestionIndex,
          difference: reduxQuestionIndex - currentQuestionIndex,
        });
      }
    });

    return () => {
      console.log("MCQTest: Cleaning up Redux store subscription");
      isComponentMounted = false;
      unsubscribe();
    };
  }, [currentQuestionIndex, questions.length, inProgress]);

  // Initialize question timer
  useEffect(() => {
    console.log("MCQTest: Question effect triggered", {
      currentQuestionIndex,
      currentQuestionId: currentQuestion?.id,
      questionsLength: questions.length,
      inProgress,
      hasCurrentQuestion: !!currentQuestion,
      questionKey,
    });

    if (currentQuestion && inProgress) {
      console.log("MCQTest: Starting new question", {
        index: currentQuestionIndex,
        questionId: currentQuestion.id,
        timeLimit: currentQuestion.seconds,
        questionText: currentQuestion.text.substring(0, 50) + "...",
      });

      const timeLimit = currentQuestion.seconds || 30;
      setTimeRemaining(timeLimit);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
      setIsSubmitting(false); // Reset submitting state for new question

      // Clear any previous errors
      dispatch(clearError());
    }
  }, [
    currentQuestion,
    currentQuestionIndex,
    inProgress,
    dispatch,
    questions.length,
    questionKey,
  ]);

  // Timer countdown
  useEffect(() => {
    if (!inProgress || paused || timeRemaining <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires
          console.log("MCQTest: Timer expired, auto-submitting");
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, paused, inProgress, isSubmitting, handleTimeUp]);

  // Handle pause/resume
  const handlePauseToggle = () => {
    if (paused) {
      dispatch(resumeInterview());
    } else {
      dispatch(pauseInterview());
    }
  };

  // Test function to manually advance question
  const handleTestNextQuestion = () => {
    console.log("MCQTest: Manual test - advancing to next question");
    dispatch(nextQuestion());
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
        return "green";
      case "medium":
        return "orange";
      case "hard":
        return "red";
      default:
        return "blue";
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading your interview questions...</Text>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <Alert
          message="Question Loading Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => dispatch(clearError())}>
              Dismiss
            </Button>
          }
        />
      </Card>
    );
  }

  // No questions state
  if (!questions.length || !currentQuestion) {
    console.log("MCQTest: No questions or current question", {
      questionsLength: questions.length,
      currentQuestionIndex,
      hasCurrentQuestion: !!currentQuestion,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text.substring(0, 30) + "...",
      })),
    });

    return (
      <Card>
        <Alert
          message="No Questions Available"
          description="Unable to load interview questions. Please try refreshing or contact support."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Progress Header */}
        <Card size="small">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Text strong>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Progress
                  percent={progress}
                  size="small"
                  showInfo={false}
                  strokeColor={{
                    "0%": "#7c3aed",
                    "100%": "#a855f7",
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Tag color={getDifficultyColor(currentQuestion.level)}>
                  {currentQuestion.level || "Medium"}
                </Tag>
                <Tag
                  icon={<ClockCircleOutlined />}
                  color={timeRemaining <= 10 ? "red" : "blue"}
                >
                  {formatTime(timeRemaining)}
                </Tag>
              </div>
              {paused && (
                <Tag color="orange" style={{ marginTop: 4 }}>
                  PAUSED
                </Tag>
              )}
            </div>
          </div>
        </Card>

        {/* Question Card */}
        <Card
          title={
            <Space>
              <QuestionCircleOutlined />
              <span>Interview Question</span>
            </Space>
          }
          extra={
            <Button
              size="small"
              onClick={handlePauseToggle}
              disabled={isSubmitting}
            >
              {paused ? "Resume" : "Pause"}
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Question Text */}
            <div>
              <Title level={4} style={{ marginBottom: 16 }}>
                {currentQuestion.text}
              </Title>

              {currentQuestion.context && (
                <Paragraph type="secondary">
                  <strong>Context:</strong> {currentQuestion.context}
                </Paragraph>
              )}
            </div>

            <Divider />

            {/* Answer Options */}
            <div>
              <Text strong style={{ marginBottom: 16, display: "block" }}>
                Select your answer:
              </Text>

              <Radio.Group
                onChange={(e) => setSelectedOption(e.target.value)}
                value={selectedOption}
                style={{ width: "100%" }}
                disabled={paused || isSubmitting}
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <Radio
                      key={`${questionKey}-option-${index}`}
                      value={option}
                      style={{
                        padding: "12px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "6px",
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: 0,
                      }}
                    >
                      <span style={{ marginLeft: "8px", flex: 1 }}>
                        {option}
                      </span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            {/* Warning for no selection */}
            {timeRemaining <= 10 && !selectedOption && (
              <Alert
                message="Time running out!"
                description="Please select an answer or the question will be auto-submitted."
                type="warning"
                showIcon
              />
            )}

            {paused && (
              <Alert
                message="Interview Paused"
                description="Timer is paused. Click Resume to continue."
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* Submit Button */}
        <Card size="small">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              {selectedOption ? (
                <Text type="success">
                  <CheckOutlined /> Answer selected
                </Text>
              ) : (
                <Text type="secondary">Please select an answer above</Text>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                type="primary"
                size="large"
                onClick={() => handleSubmitAnswer(false)}
                disabled={!selectedOption || paused || isSubmitting}
                loading={isSubmitting}
                icon={isLastQuestion ? <CheckOutlined /> : <RightOutlined />}
              >
                {isSubmitting
                  ? "Submitting..."
                  : isLastQuestion
                  ? "Submit & Finish Interview"
                  : "Next Question"}
              </Button>

              <Button
                type="default"
                size="large"
                onClick={handleTestNextQuestion}
                disabled={isLastQuestion || paused || isSubmitting}
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "white",
                }}
              >
                TEST: Skip Question
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card size="small">
          <Text type="secondary" style={{ fontSize: "12px" }}>
            💡 <strong>Instructions:</strong> Select the best answer from the
            options above. You can pause the interview if needed. The question
            will auto-submit when time runs out.
            {isLastQuestion && " This is the final question - good luck!"}
          </Text>
        </Card>
      </Space>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders while ensuring it updates when needed
export default React.memo(MCQTest, (prevProps, nextProps) => {
  // Re-render if onAnswer prop changes (shouldn't happen but safety check)
  return prevProps.onAnswer === nextProps.onAnswer;
});
