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
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OA</span>
                </div>
                <span className="text-lg font-semibold text-gray-800 hidden sm:block">
                  Online Assessment
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Question</span>
                <span className="text-sm font-semibold text-gray-900">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>

              <div
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                  timeRemaining <= 10 ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                <ClockCircleOutlined
                  className={
                    timeRemaining <= 10 ? "text-red-500" : "text-gray-500"
                  }
                />
                <span
                  className={`text-sm font-mono font-semibold ${
                    timeRemaining <= 10 ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Progress
            percent={progress}
            showInfo={false}
            strokeColor={{
              "0%": "#7c3aed",
              "100%": "#4f46e5",
            }}
            className="mb-0"
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Panel - Takes more space on desktop */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Question Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-violet-600 font-semibold text-sm">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-gray-700 font-medium">
                      Multiple Choice Question
                    </span>
                  </div>
                  <Tag
                    color={getDifficultyColor(currentQuestion.level)}
                    className="m-0"
                  >
                    {currentQuestion.level || "Medium"}
                  </Tag>
                </div>
              </div>

              {/* Question Content */}
              <div className="px-6 py-6">
                <Title level={4} className="text-gray-900 mb-4 leading-relaxed">
                  {currentQuestion.text}
                </Title>

                {currentQuestion.context && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Text className="text-sm text-gray-700">
                      <strong className="text-gray-900">Context:</strong>{" "}
                      {currentQuestion.context}
                    </Text>
                  </div>
                )}

                {/* Answer Options */}
                <div className="mt-6">
                  <Text className="text-sm font-medium text-gray-700 mb-3 block">
                    Select the correct answer:
                  </Text>

                  <Radio.Group
                    onChange={(e) => setSelectedOption(e.target.value)}
                    value={selectedOption}
                    className="w-full"
                    disabled={paused || isSubmitting}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option, index) => (
                        <div
                          key={`${questionKey}-option-${index}`}
                          className={`relative transition-all duration-200 ${
                            selectedOption === option
                              ? "ring-2 ring-violet-500 bg-violet-50 rounded-lg"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Radio
                            value={option}
                            className="w-full p-4 border border-gray-200 rounded-lg flex items-start m-0"
                          >
                            <div className="flex items-start w-full">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1 text-gray-800 leading-relaxed">
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
                    description="Please select an answer or the question will be auto-submitted."
                    type="warning"
                    showIcon
                    className="mt-6"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Side Panel - Info and Actions */}
          <div className="lg:col-span-4 space-y-4">
            {/* Question Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Assessment Progress
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Questions</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {questions.length}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    Current Question
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {currentQuestionIndex + 1}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {questions.length - currentQuestionIndex - 1}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-violet-600">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="space-y-3">
                <Button
                  type="primary"
                  size="middle"
                  block
                  onClick={() => handleSubmitAnswer(false, false)}
                  disabled={!selectedOption || paused || isSubmitting}
                  loading={isSubmitting}
                  icon={isLastQuestion ? <CheckOutlined /> : <RightOutlined />}
                  className="h-10 font-medium"
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
                  block
                  onClick={handleTestNextQuestion}
                  disabled={isLastQuestion || paused || isSubmitting}
                  className="h-9 text-xs"
                >
                  Skip Question
                </Button>
              </div>

              {selectedOption ? (
                <div className="mt-4 flex items-center justify-center text-green-600 text-sm">
                  <CheckOutlined className="mr-1" />
                  <span>Answer selected</span>
                </div>
              ) : (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  Please select an answer
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">💡</span> Instructions
              </h3>
              <ul className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
                <li>• Select the most appropriate answer</li>
                <li>• Auto-submits when timer expires</li>
                <li>• Cannot change answer after submission</li>
                {isLastQuestion && (
                  <li className="font-semibold">
                    • This is the final question!
                  </li>
                )}
              </ul>
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
