import React, { useEffect, useState } from "react";
import { Card, Radio, Button, Typography, Progress, Space, Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  recordAnswer,
  nextQuestion,
  scoreAnswers,
  completeInterview,
  nextInterviewStep,
} from "../../store/intervieweeSlice.js";
import Timer from "../Timer/Timer.jsx";

const { Title, Text } = Typography;

const MCQTest = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { questions, currentQuestionIndex, paused, inProgress } = useSelector(
    (state) => state.interviewee
  );

  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30); // Default 30 seconds per question
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      // Each question has its own time limit based on difficulty
      const seconds = currentQuestion.seconds || 30;
      setTimeRemaining(seconds);
      setSelectedOption(null);
    }
  }, [currentQuestion]);

  // Timer countdown logic
  useEffect(() => {
    if (!inProgress || paused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, paused, inProgress]);

  const handleSubmitAnswer = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const questionId = currentQuestion.id;
    const isLast = currentQuestionIndex === questions.length - 1;

    // Record the selected answer
    await dispatch(
      recordAnswer({
        questionId,
        answer: selectedOption,
        secondsSpent: currentQuestion.seconds - timeRemaining,
        isMultipleChoice: true,
      })
    );

    if (isLast) {
      const res = await dispatch(scoreAnswers());
      dispatch(completeInterview(res.payload));
      dispatch(nextInterviewStep());
      if (onComplete) onComplete();
    } else {
      dispatch(nextQuestion());
    }

    setIsSubmitting(false);
  };

  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );

  if (!currentQuestion) {
    return <Alert message="Loading questions..." type="info" />;
  }

  return (
    <Card
      title={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
      bordered
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Progress percent={progress} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text>Difficulty: {currentQuestion.level || "Medium"}</Text>
          <div>
            <Text strong>Time Remaining: </Text>
            <Text type={timeRemaining < 10 ? "danger" : "secondary"}>
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </Text>
          </div>
        </div>

        <Title level={4}>{currentQuestion.text}</Title>

        <Radio.Group
          onChange={(e) => setSelectedOption(e.target.value)}
          value={selectedOption}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {currentQuestion.options?.map((option, index) => (
              <Radio key={index} value={option} style={{ marginBottom: 8 }}>
                {option}
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="primary"
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null || isSubmitting}
          >
            {currentQuestionIndex === questions.length - 1
              ? "Submit & Finish"
              : "Next Question"}
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default MCQTest;
