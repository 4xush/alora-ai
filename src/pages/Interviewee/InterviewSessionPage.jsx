import React, { useState, useEffect } from "react";
import { Button, Typography, Alert, Spin } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { Brain, AlertCircle, Home } from "lucide-react";
import MCQTest from "../../components/MCQTest/MCQTest";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";

const { Title, Text } = Typography;

/**
 * InterviewSessionPage - Parent component that manages the interview flow
 * Renders the MCQTest component which handles all UI and question logic
 */
const InterviewSessionPage = () => {
  const {
    questions,
    answers,
    currentQuestionIndex,
    loading,
    error,
    handleAnswerSubmit,
    handleBackToDashboard,
  } = useInterviewFlow();

  // Check if we're at the last question
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

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

  // Show loading state while preparing interview
  if (
    !questions ||
    questions.length === 0 ||
    (loading && currentQuestionIndex === 0)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>

          <Title level={2} className="mb-3">
            Preparing Your Assessment
          </Title>
          <Text className="block mb-8 text-gray-600 text-base">
            We're generating personalized questions based on your profile. This
            will just take a moment...
          </Text>

          <Spin size="large" />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Text className="text-sm text-blue-800">
              💡 Tip: Make sure you're in a quiet environment with stable
              internet connection
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Global Error Display - Only shows if there's a critical error */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            className="shadow-lg"
          />
        </div>
      )}

      {/* MCQTest Component handles all the UI */}
      {currentQuestion && <MCQTest onAnswer={handleAnswerSubmit} />}

      {/* Exit Button - Fixed position */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={handleBackToDashboard}
          icon={<Home className="w-4 h-4" />}
          size="large"
          className="shadow-lg hover:shadow-xl transition-shadow"
          danger
        >
          Exit Assessment
        </Button>
      </div>

      {/* Loading Overlay for Answer Submission */}
      {loading && currentQuestionIndex > 0 && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md">
            <Spin size="large" />
            <Text className="block mt-6 text-lg font-medium text-gray-800">
              {isLastQuestion
                ? "Finalizing your assessment..."
                : "Processing your answer..."}
            </Text>
            <Text className="block mt-2 text-sm text-gray-500">
              {isLastQuestion
                ? "Calculating results and preparing your summary"
                : "Please wait a moment"}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSessionPage;
