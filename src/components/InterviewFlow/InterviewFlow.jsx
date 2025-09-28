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
  Form,
  Input,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  pauseInterview,
  resumeInterview,
  setCurrentStep,
  nextInterviewStep,
  previousInterviewStep,
  setProfile,
} from "../../store/intervieweeSlice.js";
import { store } from "../../store/store.js";
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
    profile,
    resume,
    finalScore,
    finalSummary,
  } = useSelector((s) => s.interviewee);

  // Use local state for the current step to avoid Redux persistence issues
  const [localCurrentStep, setLocalCurrentStep] = useState(0);

  // Get currentStep from Redux but default to localCurrentStep if undefined
  const currentStep = useSelector((s) => {
    const reduxStep = s.interviewee.currentStep;
    return reduxStep !== undefined ? reduxStep : localCurrentStep;
  });

  // Keep Redux and local state in sync
  useEffect(() => {
    // If Redux state is undefined, set it from local state
    if (currentStep === undefined) {
      console.log("Setting Redux step from local:", localCurrentStep);
      dispatch(setCurrentStep(localCurrentStep));
    }
    // Otherwise update local state from Redux
    else if (localCurrentStep !== currentStep) {
      console.log("Updating local step from Redux:", currentStep);
      setLocalCurrentStep(currentStep);
    }

    // Log for debugging
    console.log(
      "Current step in component:",
      currentStep,
      "Local:",
      localCurrentStep
    );
  }, [currentStep, localCurrentStep, dispatch]);

  // Force re-render when resume text changes
  useEffect(() => {
    if (resume.text) {
      console.log("Resume text changed, length:", resume.text.length);
    }
  }, [resume.text]);
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

  // Define state for editable profile outside the render function
  const [editableProfile, setEditableProfile] = useState({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
  });

  // Check both Redux profile and local editable profile
  const canStartTest =
    !!(editableProfile.email || profile.email) &&
    !!(editableProfile.name || profile.name) &&
    !!resume.text;

  // Update editable profile when Redux profile changes
  useEffect(() => {
    setEditableProfile({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
  }, [profile]);

  const updateProfile = (field, value) => {
    console.log(`Updating profile ${field} to:`, value);
    setEditableProfile((prev) => {
      const newProfile = { ...prev, [field]: value };
      console.log("New editable profile:", newProfile);
      return newProfile;
    });
    dispatch(setProfile({ [field]: value }));
    // Log the Redux state after dispatch
    setTimeout(() => {
      console.log(
        "Redux profile after update:",
        store.getState().interviewee.profile
      );
    }, 0);
  };

  const renderStepContent = () => {
    // Use localCurrentStep to ensure consistent rendering
    const step = Number(localCurrentStep);
    console.log("Rendering content for step:", step);

    switch (step) {
      case 0: // Resume Upload
        return (
          <Card title="Step 1: Upload Resume" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              <ResumeUploader onParsed={onResumeParsed} />
              <Button
                type="primary"
                onClick={() => {
                  console.log(
                    "Next button clicked, currentStep before:",
                    localCurrentStep
                  );

                  // Update local state first for immediate UI response
                  setLocalCurrentStep(1);

                  // Then try to update Redux state
                  dispatch(setCurrentStep(1));

                  console.log("Next clicked: Step set to 1");
                }}
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
              <Alert
                message="Please verify and update your information if needed"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form layout="vertical" style={{ width: "100%" }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item
                      label="Name"
                      required
                      validateStatus={!editableProfile.name ? "error" : ""}
                      help={!editableProfile.name ? "Name is required" : ""}
                    >
                      <Input
                        value={editableProfile.name}
                        onChange={(e) => updateProfile("name", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Email"
                      required
                      validateStatus={!editableProfile.email ? "error" : ""}
                      help={!editableProfile.email ? "Email is required" : ""}
                    >
                      <Input
                        type="email"
                        value={editableProfile.email}
                        onChange={(e) => updateProfile("email", e.target.value)}
                        placeholder="Enter your email address"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item label="Phone">
                      <Input
                        value={editableProfile.phone}
                        onChange={(e) => updateProfile("phone", e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

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

              <Space direction="vertical" style={{ width: "100%" }}>
                {!(editableProfile.name && editableProfile.email) && (
                  <Alert
                    message="Please complete required fields"
                    description="Both name and email are required to proceed."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Space>
                  <Button
                    onClick={() => {
                      // Update local state first
                      setLocalCurrentStep(0);
                      // Then update Redux
                      dispatch(setCurrentStep(0));
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      if (!editableProfile.name || !editableProfile.email) {
                        setLocalError("Both name and email are required.");
                        return;
                      }

                      // Make sure Redux profile is updated with the latest editable values
                      dispatch(
                        setProfile({
                          name: editableProfile.name,
                          email: editableProfile.email,
                          phone: editableProfile.phone,
                        })
                      );

                      console.log(
                        "Starting test with profile:",
                        editableProfile
                      );
                      setLocalError("");

                      // Wait for Redux state to update
                      setTimeout(() => {
                        onStart();
                      }, 100);
                    }}
                    disabled={
                      !(
                        editableProfile.name &&
                        editableProfile.email &&
                        resume.text
                      )
                    }
                  >
                    Start Test
                  </Button>
                </Space>
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
    console.log("Local step:", localCurrentStep);
    console.log("Resume text exists:", !!resume.text);
    console.log("Profile:", profile);
  }, [currentStep, localCurrentStep, resume.text, profile]);

  // Use local state for rendering to ensure consistent UI
  const stepContent = renderStepContent();

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Steps current={localCurrentStep} style={{ marginBottom: 24 }}>
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
