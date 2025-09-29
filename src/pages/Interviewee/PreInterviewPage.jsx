import React, { useState, useEffect } from "react";
import {
  Card,
  Steps,
  Button,
  Form,
  Input,
  Alert,
  Space,
  Typography,
  Divider,
  Modal,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  UndoOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import ResumeUploader from "../../components/ResumeUploader/ResumeUploader";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import useInterviewPersistence from "../../hooks/interviewee/useInterviewPersistence";
import {
  setCurrentStep,
  updateProfileField,
  setProfile,
  clearError,
  resumeInterview,
} from "../../store/intervieweeSlice";

const { Step } = Steps;
const { Title, Text } = Typography;

/**
 * Pre-interview page that handles resume upload and profile verification
 * This is step 0 and 1 of the interview process
 */
const PreInterviewPage = () => {
  const dispatch = useDispatch();
  const {
    profile,
    resume,
    currentStep,
    loading,
    error,
    inProgress,
    paused,
    handleResumeParsed,
    handleStartInterview,
    handleBackToDashboard,
  } = useInterviewFlow();

  // Use interview persistence hook
  const { hasSavedProgress } = useInterviewPersistence();

  // Local state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState(0); // 0: initial, 1: analyzing, 2: extracting

  // Processing animation effect
  useEffect(() => {
    let interval;
    if (loading) {
      // Reset stage
      setProcessingStage(0);

      // Progress through stages for visual feedback
      interval = setInterval(() => {
        setProcessingStage((prev) => (prev < 2 ? prev + 1 : prev));
      }, 2500);
    }

    return () => clearInterval(interval);
  }, [loading]);

  // Form instance for profile verification
  const [form] = Form.useForm();
  const [localError, setLocalError] = useState("");
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);

  // Check for resumable interview on component mount
  useEffect(() => {
    // Check if there's a paused interview that can be resumed
    if ((inProgress && paused) || hasSavedProgress) {
      setShowResumeModal(true);
    }
  }, [inProgress, paused, hasSavedProgress]);

  // Handle redirection if we're on an invalid step
  useEffect(() => {
    // If we somehow got to step 2 or 3 in the pre-interview page, redirect back to step 1
    if (currentStep === 2 || currentStep === 3) {
      console.log("Redirecting from invalid step:", currentStep);
      dispatch(setCurrentStep(1));
    }
  }, [currentStep, dispatch]);

  // Sync form values with Redux profile
  useEffect(() => {
    if (currentStep === 1) {
      // Log the profile data we're trying to set
      console.log("PreInterviewPage: Syncing form with profile data:", {
        name: profile?.name || "(empty)",
        email: profile?.email || "(empty)",
        phone: profile?.phone || "(empty)",
      });

      // Force the form to reset with the new values
      form.resetFields();

      // Then explicitly set each field
      form.setFieldsValue({
        name: profile?.name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
      });
    }
  }, [profile, form, currentStep]);

  // Handle profile field updates
  const handleProfileChange = (changedFields) => {
    // Update Redux state for each changed field
    changedFields.forEach(({ name, value }) => {
      const fieldName = Array.isArray(name) ? name[0] : name;
      dispatch(updateProfileField({ field: fieldName, value }));
    });

    // Clear errors when user starts typing
    if (localError || error) {
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

      // Update Redux state with latest form values
      dispatch(setProfile(values));

      // Additional validation
      if (!resume?.text) {
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
      handleStartInterview();
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

  // Content for each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="py-6">
            <Title level={3}>Upload Your Resume</Title>
            <Text className="block mb-6 text-slate-600">
              Upload your resume to help us generate personalized interview
              questions.
            </Text>

            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-600 mb-4">
                      {processingStage === 0 ? (
                        <FileTextOutlined style={{ fontSize: 36 }} />
                      ) : (
                        <LoadingOutlined style={{ fontSize: 36 }} />
                      )}
                    </div>
                    <Title level={4}>Preparing Your Interview</Title>
                    <Text type="secondary">
                      {processingStage === 0 && "Uploading your resume..."}
                      {processingStage === 1 && "Analyzing resume content..."}
                      {processingStage === 2 &&
                        "Extracting professional details..."}
                    </Text>
                    <div className="mt-6">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
                          style={{ width: `${(processingStage + 1) * 33}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <Text type="secondary" className="text-xs">
                    This may take a moment as we prepare personalized questions
                    based on your profile.
                  </Text>
                </div>
              </div>
            )}

            {/* Resume Uploader */}
            <ResumeUploader
              onParsed={handleResumeParsed}
              existingResume={resume}
              className="mb-6"
            />

            {resume?.text && (
              <div className="mt-6">
                <Alert
                  message="Resume Uploaded Successfully"
                  description="Your resume has been processed. Please verify your information in the next step."
                  type="success"
                  showIcon
                />
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="py-6">
            <Title level={3}>Verify Your Information</Title>
            <Text className="block mb-2 text-slate-600">
              Please verify the information we extracted from your resume.
            </Text>

            {/* The loading state is now handled by the overlay */}

            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleProfileChange}
              initialValues={{
                name: profile?.name || "",
                email: profile?.email || "",
                phone: profile?.phone || "",
              }}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input placeholder="Your full name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Your email address" />
              </Form.Item>

              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="Your phone number (optional)" />
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
      case 3:
        // If we somehow got to step 2 or 3 in the pre-interview page, redirect back to step 1
        // No useEffect here - we'll handle this at the component level
        return (
          <div className="py-6">
            <div className="text-center">
              <Spin />
              <Text className="block mt-4">
                Redirecting to the correct step...
              </Text>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-6">
            <Alert
              message="Navigation Error"
              description="Something went wrong. Please go back to the dashboard."
              type="error"
              showIcon
            />
          </div>
        );
    }
  };

  // Display any errors
  const displayError = localError || error;

  // Handle resume interview
  const handleResumeInterview = () => {
    setResumeLoading(true);

    try {
      // Dispatch resume action
      dispatch(resumeInterview());

      // Navigate to interview page
      window.location.href = "/interviewee/interview";
    } catch (error) {
      console.error("Failed to resume interview:", error);
      setLocalError(
        "Failed to resume interview. Please try starting a new one."
      );
    } finally {
      setResumeLoading(false);
      setShowResumeModal(false);
    }
  };

  // Handle starting a new interview instead of resuming
  const handleStartNew = () => {
    setShowResumeModal(false);
  };

  return (
    <div className="p-8">
      <Card className="shadow-sm">
        {/* Resume Interview Modal */}
        <Modal
          title="Resume Interview"
          open={showResumeModal}
          footer={null}
          closable={false}
          maskClosable={false}
        >
          <p>
            You have an interview in progress. Would you like to resume where
            you left off?
          </p>
          <div className="flex justify-end mt-6 space-x-4">
            <Button onClick={handleStartNew} icon={<UndoOutlined />}>
              Start New
            </Button>
            <Button
              type="primary"
              onClick={handleResumeInterview}
              loading={resumeLoading}
              icon={<PlayCircleOutlined />}
            >
              Resume Interview
            </Button>
          </div>
        </Modal>

        {/* Steps indicator */}
        <Steps current={currentStep} className="mb-8">
          <Step title="Resume" description="Upload your resume" />
          <Step title="Profile" description="Verify your details" />
          <Step title="Interview" description="Start the interview" />
        </Steps>

        {/* Error display */}
        {displayError && (
          <Alert
            message="Error"
            description={displayError}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        {/* Step content */}
        {renderStepContent()}

        <Divider />

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Space>
            <Button
              onClick={handleBackToDashboard}
              icon={<ArrowLeftOutlined />}
            >
              Back to Dashboard
            </Button>
          </Space>

          <Space>
            {currentStep > 0 && (
              <Button
                onClick={() => dispatch(setCurrentStep(currentStep - 1))}
                disabled={loading}
              >
                Previous
              </Button>
            )}

            {currentStep === 0 && (
              <Button
                type="primary"
                onClick={() => dispatch(setCurrentStep(1))}
                disabled={!resume?.text || loading}
                icon={<ArrowRightOutlined />}
              >
                Next
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                type="primary"
                onClick={validateAndStartInterview}
                loading={isValidatingProfile || loading}
              >
                Start Interview
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PreInterviewPage;
