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
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  ClockCircleOutlined,
  CheckOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  setError,
  clearError,
  nextQuestion,
} from "../../store/intervieweeSlice.js";
import { store } from "../../store/store.js";

const { Title, Text } = Typography;

const MCQTest = ({ onAnswer }) => {
  const dispatch = useDispatch();

  const {
    questions,
    currentQuestionIndex,
    answers,
    paused,
    inProgress,
    loading,
    error,
  } = useSelector((state) => state.interviewee);

  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const isSubmittingRef = useRef(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );

  const questionKey = useMemo(() => {
    return `${currentQuestionIndex}-${currentQuestion?.id || "no-question"}`;
  }, [currentQuestionIndex, currentQuestion?.id]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const handleSubmitAnswer = useCallback(
    async (isTimeUp = false, fromAutoSubmit = false) => {
      const currentIndex = currentQuestionIndexRef.current;
      const currentQ = questions[currentIndex];
      const isCurrentlySubmitting = isSubmittingRef.current;

      if (isCurrentlySubmitting || !currentQ) {
        return;
      }

      setIsSubmitting(true);
      isSubmittingRef.current = true;

      try {
        const secondsSpent = questionStartTime
          ? Math.round((Date.now() - questionStartTime) / 1000)
          : (currentQ.seconds || 30) - timeRemaining;

        const answerData = {
          questionId: currentQ.id,
          answer: selectedOption || "",
          secondsSpent,
          isLast: currentIndex === questions.length - 1,
          isMultipleChoice: true,
          options: currentQ.options,
          correctAnswer: currentQ.correctAnswer,
          wasTimeUp: isTimeUp,
          fromAutoSubmit: fromAutoSubmit || isTimeUp,
        };

        if (onAnswer) {
          await onAnswer(answerData);
        }
      } catch (error) {
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

  const handleTimeUp = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const currentIndex = currentQuestionIndexRef.current;
    const currentQ = questions[currentIndex];

    if (!currentQ) {
      return;
    }

    await handleSubmitAnswer(true, true);
  }, [questions, handleSubmitAnswer]);

  useEffect(() => {
    const currentStatus = store.getState().interviewee.status;

    if (currentStatus === "completed" || !inProgress) {
      return;
    }

    let isComponentMounted = true;
    const unsubscribe = store.subscribe(() => {
      if (!isComponentMounted) return;

      const state = store.getState();
      const interviewStatus = state.interviewee.status;

      if (interviewStatus === "completed" || !state.interviewee.inProgress) {
        return;
      }
    });

    return () => {
      isComponentMounted = false;
      unsubscribe();
    };
  }, [currentQuestionIndex, questions.length, inProgress]);

  useEffect(() => {
    if (currentQuestion && inProgress) {
      const timeLimit = currentQuestion.seconds || 30;
      setTimeRemaining(timeLimit);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
      setIsSubmitting(false);
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

  useEffect(() => {
    if (!inProgress || paused || timeRemaining <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, paused, inProgress, isSubmitting, handleTimeUp]);

  const handleTestNextQuestion = () => {
    dispatch(nextQuestion());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-600">
            Loading your interview questions...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Alert
          message="Question Loading Error"
          description={error}
          type="error"
          showIcon
          className="max-w-lg"
          action={
            <Button size="small" onClick={() => dispatch(clearError())}>
              Dismiss
            </Button>
          }
        />
      </div>
    );
  }

  if (!questions.length || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Alert
          message="No Questions Available"
          description="Unable to load interview questions. Please try refreshing or contact support."
          type="warning"
          showIcon
          className="max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={{
            "0%": "#7c3aed",
            "100%": "#4f46e5",
          }}
          className="mb-0"
          strokeWidth={4}
        />
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Question Header */}
          <div className="px-6 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm text-violet-600 font-semibold">
                  {currentQuestionIndex + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-gray-900 font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-gray-600 text-sm">
                    Multiple Choice Question
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tag
                  color={getDifficultyColor(currentQuestion.level)}
                  className="m-0"
                >
                  {currentQuestion.level || "Medium"}
                </Tag>

                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    timeRemaining <= 10 ? "bg-red-50" : "bg-gray-100"
                  }`}
                >
                  <ClockCircleOutlined
                    className={
                      timeRemaining <= 10 ? "text-red-500" : "text-gray-600"
                    }
                  />
                  <span
                    className={`text-sm font-mono font-semibold ${
                      timeRemaining <= 10 ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="px-6 py-4">
            <Title level={4} className="text-gray-900 mb-4 leading-snug">
              {currentQuestion.text}
            </Title>

            {currentQuestion.context && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Text className="text-sm text-gray-700">
                  <strong className="text-gray-900">Context:</strong>{" "}
                  {currentQuestion.context}
                </Text>
              </div>
            )}

            {/* Answer Options */}
            <div className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-3 block">
                Select the correct answer:
              </Text>

              <Radio.Group
                onChange={(e) => setSelectedOption(e.target.value)}
                value={selectedOption}
                className="w-full"
                disabled={paused || isSubmitting}
              >
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={`${questionKey}-option-${index}`}
                      className="relative transition-all duration-200"
                    >
                      <Radio
                        value={option}
                        className="w-full p-3 border border-gray-200 rounded-lg flex items-start m-0 hover:border-gray-300"
                      >
                        <div className="flex items-start w-full">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1 text-gray-800 leading-snug">
                            {option}
                          </span>
                        </div>
                      </Radio>
                    </div>
                  ))}
                </div>
              </Radio.Group>
            </div>

            {/* Warning Alert */}
            {timeRemaining <= 10 && !selectedOption && (
              <Alert
                message="Time running out!"
                description="Please select an answer."
                type="warning"
                showIcon
                className="mt-3 text-xs py-1"
              />
            )}

            {/* Action Buttons - Moved Below Options */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="primary"
                  size="middle"
                  onClick={() => handleSubmitAnswer(false, false)}
                  disabled={!selectedOption || paused || isSubmitting}
                  loading={isSubmitting}
                  icon={isLastQuestion ? <CheckOutlined /> : <RightOutlined />}
                  className="px-5 font-medium"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isLastQuestion
                    ? "Finish Assessment"
                    : "Next Question"}
                </Button>
                                <Button
                  danger
                  size="middle"
                  onClick={handleTestNextQuestion}
                  disabled={isLastQuestion || paused || isSubmitting}
                  className="px-5"
                >
                  Skip Question
                </Button>
              </div>

              {selectedOption && (
                <div className="mt-3 flex items-center justify-end text-green-600 text-sm">
                  <CheckOutlined className="mr-1" />
                  <span>Answer selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MCQTest, (prevProps, nextProps) => {
  return prevProps.onAnswer === nextProps.onAnswer;
});
