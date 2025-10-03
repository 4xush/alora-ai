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

import ResumeInterviewModal from "../../components/ResumeInterviewModal/ResumeInterviewModal";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import { useInterviewPersistence } from "../../hooks/interviewee/useInterviewPersistence";
import {
  setCurrentStep,
  updateProfileField,
  setProfile,
  clearError,
  resumeInterview,
  resetInterview,
} from "../../store/intervieweeSlice";
import { removeAbandonedAttempt } from "../../store/interviewerSlice";
import { STORAGE_KEYS } from "../../utils/storageUtils";
import { ClipboardCheck } from "lucide-react";
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
    handleResumeInterview,
  } = useInterviewFlow();

  const { resumableInterviewInfo } = useInterviewPersistence();

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
    // Only check for resumable interviews if we are not in the middle of one
    if (!inProgress && resumableInterviewInfo) {
      const shouldShowModal =
        localStorage.getItem("show_resume_interview_modal") === "true";

      if (shouldShowModal) {
        console.log(
          "Showing resume interview modal for:",
          resumableInterviewInfo
        );
        setShowResumeModal(true);
        // Once shown, clear the flag from localStorage
        localStorage.removeItem("show_resume_interview_modal");
      }
    }
  }, [inProgress, resumableInterviewInfo]);

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
      await handleStartInterview(); // Wait for this to complete
      // Don't set isValidatingProfile to false here as we're navigating away
    } catch (err) {
      setLocalError(err.message || "Please complete your profile to continue");
      setIsValidatingProfile(false); // Only set to false on error
    }
  };

  const handleResumeClick = () => {
    setResumeLoading(true);
    try {
      // Direct dispatch approach as fallback
      if (!handleResumeInterview) {
        console.log("Using direct dispatch approach for resume");
        dispatch(resumeInterview());
        setTimeout(() => {
          window.location.href = "/interviewee/interview";
        }, 300);
      } else {
        // Use the hook's resume handler
        console.log("Using hook's handleResumeInterview method");
        handleResumeInterview();
      }

      // Close the modal regardless of success (navigation will happen if successful)
      setShowResumeModal(false);
    } catch (error) {
      console.error("Failed to resume interview:", error);
      setLocalError(
        "Failed to resume interview. Please try starting a new one."
      );
      setResumeLoading(false);
      setShowResumeModal(false);
    }
  };

  const handleStartNew = () => {
    if (resumableInterviewInfo?.interviewId) {
      console.log(
        "Starting new interview, clearing old progress for:",
        resumableInterviewInfo.interviewId
      );
      // Clear from localStorage
      localStorage.removeItem(
        `${STORAGE_KEYS.INTERVIEW_PROGRESS}_${resumableInterviewInfo.interviewId}`
      );
      // Reset Redux state for interviewee
      dispatch(resetInterview());
      // Notify interviewer slice to remove this in-progress attempt
      dispatch(
        removeAbandonedAttempt({
          interviewId: resumableInterviewInfo.interviewId,
        })
      );
    }
    setShowResumeModal(false);
    // Also clear any other potential flags
    localStorage.removeItem("show_resume_interview_modal");
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <ClipboardCheck className="text-white" size={24} />
                </div>
                <div>
                  <Title level={2} className="!mb-0 !text-2xl !font-bold">
                    Interview Setup
                  </Title>
                  <Text className="text-gray-500 text-sm">
                    Complete these steps to begin your assessment
                  </Text>
                </div>
              </div>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Steps Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
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
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <FileTextOutlined className="text-xl text-white" />
                    </div>
                    <div>
                      <Title level={3} className="!mb-0 !text-lg !font-bold">
                        Upload Your Resume
                      </Title>
                      <Text className="text-gray-500 text-sm">
                        We'll create personalized questions from your resume
                      </Text>
                    </div>
                  </div>
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
                    className="mt-4 rounded-lg text-sm"
                    style={{ padding: "12px 16px" }}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <UserOutlined className="text-xl text-white" />
                    </div>
                    <div>
                      <Title level={3} className="!mb-0 !text-lg !font-bold">
                        Verify Your Information
                      </Title>
                      <Text className="text-gray-500 text-sm">
                        Confirm the details from your resume
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      size="medium"
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
                      size="medium"
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
                      size="medium"
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
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
              <Button
                onClick={handleBackToDashboard}
                icon={<ArrowLeftOutlined />}
                size="medium"
                className="md:hidden"
              >
                Dashboard
              </Button>

              <div className="flex items-center space-x-3 ml-auto">
                {currentStep > 0 && (
                  <Button
                    onClick={() => dispatch(setCurrentStep(currentStep - 1))}
                    disabled={loading}
                    size="medium"
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
                    size="medium"
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
                    size="medium"
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
      <ResumeInterviewModal
        open={showResumeModal}
        onStartNew={handleStartNew}
        onResume={handleResumeClick}
        loading={resumeLoading}
        resumableInfo={resumableInterviewInfo}
      />
    </div>
  );
};

export default PreInterviewPage;
