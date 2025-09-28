import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Progress,
  Space,
  Steps,
  Typography,
  Alert,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  pauseInterview,
  resumeInterview,
  setCurrentStep,
  nextInterviewStep,
  previousInterviewStep,
} from "../../store/intervieweeSlice.js";
import ResumeUploader from "../ResumeUploader/ResumeUploader.jsx";
import MCQTest from "../MCQTest/MCQTest.jsx";
import InterviewSummary from "../InterviewSummary/InterviewSummary.jsx";

const { Step } = Steps;
const { Title, Text } = Typography;

const InterviewFlow = ({
  onAnswer,
  onStart,
  onComplete,
  onResumeParsed,
  error: externalError,
}) => {
  const dispatch = useDispatch();
  const {
    paused,
    questions,
    answers,
    currentStep = 0, // Provide default value if undefined
    profile,
    resume,
    finalScore,
    finalSummary,
  } = useSelector((s) => s.interviewee);

  // Force set the current step to 0 if it's undefined
  useEffect(() => {
    if (currentStep === undefined) {
      dispatch(setCurrentStep(0));
    }
  }, [currentStep, dispatch]);

  const [localError, setLocalError] = useState("");
  const error = externalError || localError;

  const progress = Math.round(
    ((answers.length || 0) / (questions.length || 1)) * 100
  );

  const togglePause = () => {
    if (paused) {
      dispatch(resumeInterview());
    } else {
      dispatch(pauseInterview());
    }
  };

  const canStartTest = profile.email && profile.name && resume.text;

  const renderStepContent = () => {
    // Ensure currentStep is a number
    const step = Number(currentStep);

    switch (step) {
      case 0: // Resume Upload
        return (
          <Card title="Step 1: Upload Resume" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              <ResumeUploader onParsed={onResumeParsed} />
              <Button
                type="primary"
                onClick={() => dispatch(nextInterviewStep())}
                disabled={!resume.text}
              >
                Next: Verify Details
              </Button>
              {error && (
                <div style={{ marginTop: 12, color: "red" }}>{error}</div>
              )}
            </Space>
          </Card>
        );

      case 1: // Verify Details
        return (
          <Card title="Step 2: Verify Your Details" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Title level={5}>Personal Information</Title>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text strong>Name:</Text>
                </Col>
                <Col span={16}>
                  <Text>{profile.name || "Not provided"}</Text>
                </Col>

                <Col span={8}>
                  <Text strong>Email:</Text>
                </Col>
                <Col span={16}>
                  <Text>{profile.email || "Not provided"}</Text>
                </Col>

                <Col span={8}>
                  <Text strong>Phone:</Text>
                </Col>
                <Col span={16}>
                  <Text>{profile.phone || "Not provided"}</Text>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 16 }}>
                Resume Preview
              </Title>
              <div
                style={{
                  height: "150px",
                  overflow: "auto",
                  border: "1px solid #eee",
                  padding: "8px",
                  marginBottom: "16px",
                }}
              >
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {resume.text?.slice(0, 500)}...
                </pre>
              </div>

              {error && (
                <Alert
                  type="error"
                  message={error}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Space>
                <Button onClick={() => dispatch(previousInterviewStep())}>
                  Back
                </Button>
                <Button
                  type="primary"
                  onClick={onStart}
                  disabled={!canStartTest}
                >
                  Start Test
                </Button>
              </Space>
            </Space>
          </Card>
        );

      case 2: // MCQ Test
        return <MCQTest onComplete={onComplete} />;

      case 3: // Summary
        return <InterviewSummary score={finalScore} summary={finalSummary} />;

      default:
        return null;
    }
  };

  // Debug output
  useEffect(() => {
    console.log("Current step:", currentStep);
    console.log("Resume text exists:", !!resume.text);
    console.log("Profile:", profile);
  }, [currentStep, resume.text, profile]);

  const stepContent = renderStepContent();

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Upload Resume" />
        <Step title="Verify Details" />
        <Step title="Take Test" />
        <Step title="View Results" />
      </Steps>

      {stepContent}
    </Space>
  );
};

export default InterviewFlow;
