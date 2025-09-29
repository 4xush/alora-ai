import React, { useState, useEffect } from "react";
import {
  Card,
  Progress,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Divider,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  Clock,
  Brain,
  CheckCircle2,
  AlertCircle,
  Home,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import MCQTest from "../../components/MCQTest/MCQTest";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import { pauseInterview, resumeInterview } from "../../store/intervieweeSlice";

const { Title, Text } = Typography;

/**
 * InterviewSessionPage handles the actual interview process
 * This component manages the interview questions and answers
 */
const InterviewSessionPage = () => {
  const {
    questions,
    answers,
    currentQuestionIndex,
    loading,
    error,
    progress,
    handleAnswerSubmit,
    handleBackToDashboard,
  } = useInterviewFlow();

  // Local state for UI control
  const [isPaused, setIsPaused] = useState(false);

  // Check if we're at the last question
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Handle pause/resume
  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Check if there's an active question
  const hasActiveQuestion =
    questions &&
    questions.length > 0 &&
    currentQuestionIndex >= 0 &&
    currentQuestionIndex < questions.length;

  // Get the current question
  const currentQuestion = hasActiveQuestion
    ? questions[currentQuestionIndex]
    : null;

  // Get existing answer for the current question
  const existingAnswer = hasActiveQuestion
    ? answers.find((a) => a.questionId === currentQuestion?.id)
    : null;

  // Show a loading state if we don't have questions yet
  if (
    !questions ||
    questions.length === 0 ||
    (loading && currentQuestionIndex === 0)
  ) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-white" />
        </div>

        <Title level={3}>Preparing Your Interview</Title>
        <Text className="block mb-6 text-slate-600">
          We're generating personalized questions based on your resume. This
          might take a moment...
        </Text>

        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-[600px]">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Interview in Progress
              </h3>
              <p className="text-sm text-slate-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          {progress > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-8 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pause Banner */}
      {isPaused && (
        <Alert
          message="Interview Paused"
          description="Take your time. Your progress is saved, and you can resume when ready."
          type="info"
          showIcon
          className="mx-8 mt-4"
          action={
            <Button type="primary" onClick={togglePause}>
              Resume
            </Button>
          }
        />
      )}

      {/* Main Interview Content */}
      <div className="p-8">
        {isPaused ? (
          <Card className="text-center p-8">
            <Title level={3}>Interview Paused</Title>
            <Text className="block mb-6">
              You've completed {answers.length} of {questions.length} questions.
            </Text>
            <Button type="primary" size="large" onClick={togglePause}>
              Resume Interview
            </Button>
          </Card>
        ) : (
          <Card className="shadow-sm">
            {currentQuestion && (
              <MCQTest
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                existingAnswer={existingAnswer}
                onAnswer={(answer, secondsSpent) =>
                  handleAnswerSubmit({
                    questionId: currentQuestion.id,
                    answer,
                    secondsSpent,
                    isLast: isLastQuestion,
                  })
                }
                isLast={isLastQuestion}
              />
            )}

            <Divider />

            <div className="flex justify-between">
              <Space>
                <Button
                  onClick={handleBackToDashboard}
                  icon={<Home className="w-4 h-4" />}
                >
                  Exit Interview
                </Button>
              </Space>

              <Space>
                <Button
                  onClick={togglePause}
                  icon={<PauseCircle className="w-4 h-4" />}
                >
                  Pause
                </Button>
              </Space>
            </div>
          </Card>
        )}
      </div>

      {/* Loading Overlay for Answer Submission */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Spin size="large" />
            <Text className="block mt-4">
              {isLastQuestion
                ? "Calculating your results and preparing summary..."
                : "Processing your answer..."}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSessionPage;
