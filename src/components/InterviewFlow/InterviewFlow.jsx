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
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentStep,
  nextInterviewStep,
  previousInterviewStep,
  updateProfileField,
  setProfile,
  clearError,
  setError,
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
  onBackToDashboard,
  error: externalError,
  loading: externalLoading,
  progress: externalProgress,
}) => {
  const dispatch = useDispatch();
  const {
    currentStep,
    currentQuestionIndex,
    paused,
    questions,
    answers,
    profile,
    resume,
    finalScore,
    finalSummary,
    loading,
    error: reduxError,
    status,
    inProgress,
  } = useSelector((s) => s.interviewee);

  // Form instance for profile verification
  const [form] = Form.useForm();
  const [localError, setLocalError] = useState("");
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);

  // Combined error from multiple sources
  const error = externalError || reduxError || localError;

  // Calculate progress
  const progress = Math.round(
    ((answers.length || 0) / Math.max(questions.length || 1, 1)) * 100
  );

  // Sync form values with Redux profile - only when on the profile step
  useEffect(() => {
    // Only sync form when we're on the profile step (step 1) and interview isn't completed
    if (currentStep === 1 && status !== "completed") {
      console.log("Syncing form with profile:", profile);
      form.setFieldsValue({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, form, currentStep, status]);

  // Component initialization
  useEffect(() => {
    console.log("InterviewFlow: COMPONENT MOUNTED");
  }, []);

  // Debug when component mounts or step changes
  useEffect(() => {
    console.log("InterviewFlow: Current step changed or component mounted", {
      currentStep,
      hasResume: !!resume?.text,
      resumeFileName: resume?.fileName || "none",
      inProgress: inProgress || false,
      status,
    });

    // If we have no resume and we're on step 1, go back to step 0
    if (currentStep === 1 && !resume?.text) {
      console.log(
        "InterviewFlow: No resume but on step 1, redirecting to step 0"
      );
      dispatch(setCurrentStep(0));
    }

    // If we're just starting the interview flow, ensure inProgress is true
    if (!inProgress && currentStep === 0) {
      console.log("InterviewFlow: Starting interview flow");
      // We don't actually need to dispatch startInterview here, just make sure step is correct
      if (!resume?.text && currentStep !== 0) {
        dispatch(setCurrentStep(0));
      }
    }
  }, [currentStep, resume, inProgress, status, dispatch]);

  // Handle resume parsing
  const handleResumeParsed = async (text, fileMeta) => {
    console.log("Resume parsed in InterviewFlow");
    setLocalError("");
    dispatch(clearError());

    try {
      // Call parent handler which will update resume and extract profile info
      await onResumeParsed(text, fileMeta);

      // Auto-advance to verification step
      dispatch(setCurrentStep(1));
    } catch (err) {
      console.error("Error handling resume parse:", err);
      setLocalError("Failed to process resume. Please try again.");
    }
  };

  // Handle profile field updates
  const handleProfileChange = (changedFields, allFields) => {
    console.log("Profile form changed:", changedFields);

    // Update Redux state for each changed field
    changedFields.forEach(({ name, value }) => {
      const fieldName = Array.isArray(name) ? name[0] : name;
      dispatch(updateProfileField({ field: fieldName, value }));
    });

    // Clear errors when user starts typing
    if (localError || reduxError) {
      setLocalError("");
      dispatch(clearError());
    }
  };

  // Validate profile before starting interview
  const validateAndStartInterview = async () => {
    try {
      setIsValidatingProfile(true);

      // Validate form
      const values = await form.validateFields();

      // Ensure Redux state is updated with latest form values
      dispatch(setProfile(values));

      // Additional validation
      if (!resume.text) {
        throw new Error("Resume is required to start the interview");
      }

      if (!values.name || values.name.trim().length < 2) {
        throw new Error("Please provide a valid name (at least 2 characters)");
      }

      if (!values.email || !values.email.includes("@")) {
        throw new Error("Please provide a valid email address");
      }

      // Clear any existing errors
      setLocalError("");
      dispatch(clearError());

      // Start the interview
      console.log("Starting interview with profile:", values);

      // Small delay to ensure state is updated
      setTimeout(() => {
        onStart();
      }, 100);
    } catch (err) {
      console.error("Profile validation failed:", err);
      const errorMessage = err.errorFields
        ? "Please fill in all required fields correctly"
        : err.message || "Please complete your profile to continue";

      setLocalError(errorMessage);
    } finally {
      setIsValidatingProfile(false);
    }
  };

  // Navigation handlers
  const goToNextStep = () => {
    dispatch(nextInterviewStep());
  };

  const goToPreviousStep = () => {
    dispatch(previousInterviewStep());
  };

  const goToStep = (step) => {
    dispatch(setCurrentStep(step));
  };

  // Render step content
  const renderStepContent = () => {
    console.log("InterviewFlow: Rendering content for step", currentStep, {
      hasResumeText: !!resume?.text,
      hasProfileName: !!profile?.name,
      hasEmail: !!profile?.email,
      status,
      inProgress,
      questionsCount: questions?.length || 0,
      resumeFileName: resume?.fileName || "none",
    });

    // Validate step requirements
    if (currentStep === 1 && !resume?.text) {
      console.warn(
        "InterviewFlow: On step 1 without resume, redirecting to step 0"
      );
      setTimeout(() => dispatch(setCurrentStep(0)), 0);
      return (
        <Card>
          <Spin tip="Redirecting to resume upload..." />
        </Card>
      );
    } else if (currentStep === 2 && (!profile?.name || !profile?.email)) {
      console.warn(
        "InterviewFlow: On step 2 without profile, redirecting to step 1"
      );
      setTimeout(() => dispatch(setCurrentStep(1)), 0);
      return (
        <Card>
          <Spin tip="Redirecting to profile verification..." />
        </Card>
      );
    } else if (currentStep === 3 && !finalScore && status !== "completed") {
      console.warn(
        "InterviewFlow: On step 3 without completed test, redirecting to step 2"
      );
      setTimeout(() => dispatch(setCurrentStep(2)), 0);
      return (
        <Card>
          <Spin tip="Redirecting to interview test..." />
        </Card>
      );
    }

    switch (currentStep) {
      case 0: // Resume Upload
        console.log("InterviewFlow: Rendering resume upload step");
        return (
          <Card title="Step 1: Upload Your Resume" bordered>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Text type="secondary">
                Upload your resume in PDF or DOCX format. We'll extract your
                information automatically to speed up the process.
              </Text>

              <ResumeUploader onParsed={handleResumeParsed} />

              {resume?.text && (
                <Alert
                  message="Resume uploaded successfully!"
                  description={`File: ${resume.fileName} (${Math.round(
                    resume.text.length / 1024
                  )}KB of text extracted)`}
                  type="success"
                  showIcon
                  action={
                    <Button size="small" onClick={goToNextStep}>
                      Next: Verify Details
                    </Button>
                  }
                />
              )}

              {error && (
                <Alert
                  message="Upload Error"
                  description={error}
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </Card>
        );

      case 1: // Verify Details
        return (
          <Card title="Step 2: Verify Your Information" bordered>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Alert
                message="Please verify and update your information"
                description="We've extracted this information from your resume. Please review and correct any details before proceeding."
                type="info"
                showIcon
              />

              <Form
                form={form}
                layout="vertical"
                onFieldsChange={handleProfileChange}
                initialValues={profile}
                name="profile-verification-form"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Full Name"
                      name="name"
                      rules={[
                        { required: true, message: "Name is required" },
                        {
                          min: 2,
                          message: "Name must be at least 2 characters",
                        },
                        { max: 100, message: "Name is too long" },
                      ]}
                    >
                      <Input placeholder="Enter your full name" size="large" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Email Address"
                      name="email"
                      rules={[
                        { required: true, message: "Email is required" },
                        {
                          type: "email",
                          message: "Please enter a valid email",
                        },
                      ]}
                    >
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Phone Number"
                      name="phone"
                      rules={[
                        {
                          min: 10,
                          message: "Phone number should be at least 10 digits",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Enter your phone number (optional)"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
              {error && (
                <Alert
                  message="Validation Error"
                  description={error}
                  type="error"
                  showIcon
                />
              )}

              <Row justify="space-between">
                <Col>
                  <Button onClick={() => goToStep(0)} disabled={loading}>
                    Back to Upload
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    loading={isValidatingProfile || loading}
                    onClick={validateAndStartInterview}
                  >
                    {isValidatingProfile ? "Validating..." : "Start Interview"}
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        );

      case 2: // Take Test
        return (
          <div>
            {loading && (
              <Card style={{ marginBottom: 16 }}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text>
                      Preparing your personalized interview questions...
                    </Text>
                  </div>
                </div>
              </Card>
            )}

            {!loading && questions.length > 0 && (
              <MCQTest
                key={`mcq-${currentQuestionIndex || 0}-${questions.length}`}
                onAnswer={onAnswer}
              />
            )}

            {!loading && questions.length === 0 && (
              <Card>
                <Alert
                  message="Unable to generate questions"
                  description="There was an issue generating interview questions. Please try again or contact support."
                  type="error"
                  showIcon
                  action={<Button onClick={() => goToStep(1)}>Go Back</Button>}
                />
              </Card>
            )}
          </div>
        );

      case 3: // View Results
        console.log("InterviewFlow: Rendering interview summary for step 3", {
          status,
          finalScore,
          finalSummaryLength: finalSummary?.length || 0,
        });
        return (
          <InterviewSummary
            score={finalScore}
            summary={finalSummary}
            onComplete={onComplete}
          />
        );

      default:
        return (
          <Card>
            <Alert
              message="Invalid Step"
              description="Something went wrong with the interview flow."
              type="error"
              showIcon
              action={<Button onClick={() => goToStep(0)}>Start Over</Button>}
            />
          </Card>
        );
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("InterviewFlow render:", {
      currentStep,
      status,
      hasResume: !!resume.text,
      profileComplete: !!(profile.name && profile.email),
      questionsCount: questions.length,
      answersCount: answers.length,
    });
  }, [
    currentStep,
    status,
    resume.text,
    profile,
    questions.length,
    answers.length,
  ]);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Upload Resume" description="PDF or DOCX file" />
          <Step title="Verify Details" description="Check extracted info" />
          <Step title="Take Interview" description="Answer questions" />
          <Step title="View Results" description="See your score" />
        </Steps>

        {/* Progress Bar (only show during test) */}
        {currentStep === 2 && questions.length > 0 && (
          <Card size="small">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Text strong>Progress:</Text>
              <Progress percent={progress} size="small" style={{ flex: 1 }} />
              <Text type="secondary">
                {answers.length} / {questions.length} questions
              </Text>
              {paused && (
                <Text type="warning" strong>
                  PAUSED
                </Text>
              )}
            </div>
          </Card>
        )}

        {/* Step Content */}
        {renderStepContent()}

        {/* Global Loading Overlay */}
        {loading && currentStep !== 2 && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <Spin size="large" />
          </div>
        )}
      </Space>
    </div>
  );
};

export default InterviewFlow;
