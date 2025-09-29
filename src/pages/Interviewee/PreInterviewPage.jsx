import React, { useState, useEffect } from "react";
import { Steps, Button, Form, Input, Alert, Modal, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  UndoOutlined,
  FileTextOutlined,
  LoadingOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
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

  const { hasSavedProgress } = useInterviewPersistence();

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);

  // Processing animation effect
  useEffect(() => {
    let interval;
    if (loading) {
      setProcessingStage(0);
      interval = setInterval(() => {
        setProcessingStage((prev) => (prev < 2 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Check for resumable interview
  useEffect(() => {
    if ((inProgress && paused) || hasSavedProgress) {
      setShowResumeModal(true);
    }
  }, [inProgress, paused, hasSavedProgress]);

  // Redirect from invalid steps
  useEffect(() => {
    if (currentStep === 2 || currentStep === 3) {
      dispatch(setCurrentStep(1));
    }
  }, [currentStep, dispatch]);

  // Sync form with profile
  useEffect(() => {
    if (currentStep === 1) {
      setFormFields({
        name: profile?.name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
      });
    }
  }, [profile, currentStep]);

  const handleFieldChange = (field, value) => {
    setFormFields((prev) => ({ ...prev, [field]: value }));
    dispatch(updateProfileField({ field, value }));

    // Clear errors
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
    if (localError || error) {
      setLocalError("");
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formFields.name || formFields.name.trim().length < 2) {
      errors.name = "Please enter your name (at least 2 characters)";
    }

    if (!formFields.email) {
      errors.email = "Please enter your email";
    } else if (!formFields.email.includes("@")) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAndStartInterview = async () => {
    try {
      setIsValidatingProfile(true);

      if (!validateForm()) {
        setLocalError("Please fill in all required fields correctly");
        return;
      }

      if (!resume?.text) {
        setLocalError("Resume is required to start the interview");
        return;
      }

      dispatch(setProfile(formFields));
      setLocalError("");
      dispatch(clearError());
      handleStartInterview();
    } catch (err) {
      setLocalError(err.message || "Please complete your profile to continue");
    } finally {
      setIsValidatingProfile(false);
    }
  };

  const handleResumeInterview = () => {
    setResumeLoading(true);
    try {
      dispatch(resumeInterview());
      window.location.href = "/interviewee/interview";
    } catch (error) {
      setLocalError(
        "Failed to resume interview. Please try starting a new one."
      );
    } finally {
      setResumeLoading(false);
      setShowResumeModal(false);
    }
  };

  const handleStartNew = () => {
    setShowResumeModal(false);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-1">
                Interview Setup
              </Title>
              <Text className="text-gray-600">
                Complete these steps to begin your assessment
              </Text>
            </div>
            <Button
              onClick={handleBackToDashboard}
              icon={<ArrowLeftOutlined />}
              size="large"
              className="hidden md:flex"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <Steps current={currentStep} className="px-4">
            <Step
              title={<span className="text-sm">Resume</span>}
              description={<span className="text-xs">Upload your resume</span>}
            />
            <Step
              title={<span className="text-sm">Profile</span>}
              description={<span className="text-xs">Verify details</span>}
            />
            <Step
              title={<span className="text-sm">Interview</span>}
              description={<span className="text-xs">Start assessment</span>}
            />
          </Steps>
        </div>

        {/* Error Display */}
        {displayError && (
          <Alert
            message="Error"
            description={displayError}
            type="error"
            showIcon
            closable
            onClose={() => {
              setLocalError("");
              dispatch(clearError());
            }}
            className="mb-6 rounded-lg"
          />
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentStep === 0 && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileTextOutlined className="text-3xl text-white" />
                  </div>
                  <Title level={3} className="mb-2">
                    Upload Your Resume
                  </Title>
                  <Text className="text-gray-600">
                    We'll analyze your resume to create personalized interview
                    questions
                  </Text>
                </div>

                <ResumeUploader
                  onParsed={handleResumeParsed}
                  existingResume={resume}
                />

                {resume?.text && (
                  <Alert
                    message="Resume Uploaded Successfully"
                    description="Your resume has been processed. Click Next to continue."
                    type="success"
                    showIcon
                    className="mt-6 rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserOutlined className="text-3xl text-white" />
                  </div>
                  <Title level={3} className="mb-2">
                    Verify Your Information
                  </Title>
                  <Text className="text-gray-600">
                    Please confirm the details we extracted from your resume
                  </Text>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      size="large"
                      placeholder="Enter your full name"
                      prefix={<UserOutlined className="text-gray-400" />}
                      className="rounded-lg"
                      value={formFields.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      status={formErrors.name ? "error" : ""}
                    />
                    {formErrors.name && (
                      <Text className="text-xs text-red-500 mt-1 block">
                        {formErrors.name}
                      </Text>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      size="large"
                      placeholder="your.email@example.com"
                      prefix={<MailOutlined className="text-gray-400" />}
                      className="rounded-lg"
                      value={formFields.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      status={formErrors.email ? "error" : ""}
                    />
                    {formErrors.email && (
                      <Text className="text-xs text-red-500 mt-1 block">
                        {formErrors.email}
                      </Text>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <Input
                      size="large"
                      placeholder="Enter your phone number"
                      prefix={<PhoneOutlined className="text-gray-400" />}
                      className="rounded-lg"
                      value={formFields.phone}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
              <Button
                onClick={handleBackToDashboard}
                icon={<ArrowLeftOutlined />}
                size="large"
                className="md:hidden"
              >
                Dashboard
              </Button>

              <div className="flex items-center space-x-3 ml-auto">
                {currentStep > 0 && (
                  <Button
                    onClick={() => dispatch(setCurrentStep(currentStep - 1))}
                    disabled={loading}
                    size="large"
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
                    size="large"
                    className="min-w-[120px]"
                  >
                    Next
                  </Button>
                )}

                {currentStep === 1 && (
                  <Button
                    type="primary"
                    onClick={validateAndStartInterview}
                    loading={isValidatingProfile || loading}
                    icon={
                      !isValidatingProfile && !loading && <ArrowRightOutlined />
                    }
                    size="large"
                    className="min-w-[160px]"
                  >
                    {isValidatingProfile || loading
                      ? "Starting..."
                      : "Start Interview"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-100 mb-6">
                {processingStage === 0 ? (
                  <FileTextOutlined className="text-4xl text-violet-600" />
                ) : (
                  <LoadingOutlined className="text-4xl text-violet-600" />
                )}
              </div>

              <Title level={4} className="mb-2">
                Preparing Your Interview
              </Title>
              <Text className="text-gray-600 block mb-6">
                {processingStage === 0 && "Uploading your resume..."}
                {processingStage === 1 && "Analyzing resume content..."}
                {processingStage === 2 && "Extracting professional details..."}
              </Text>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${(processingStage + 1) * 33}%` }}
                />
              </div>

              <Text className="text-xs text-gray-500">
                Preparing personalized questions based on your profile
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Resume Interview Modal */}
      <Modal
        title="Resume Previous Interview"
        open={showResumeModal}
        footer={null}
        closable={false}
        maskClosable={false}
        className="top-20"
      >
        <div className="py-4">
          <Text className="block mb-6 text-gray-600">
            You have an interview in progress. Would you like to resume where
            you left off?
          </Text>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleStartNew}
              icon={<UndoOutlined />}
              size="large"
            >
              Start New
            </Button>
            <Button
              type="primary"
              onClick={handleResumeInterview}
              loading={resumeLoading}
              icon={<PlayCircleOutlined />}
              size="large"
            >
              Resume Interview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PreInterviewPage;
