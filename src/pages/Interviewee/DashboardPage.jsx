import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  List,
  Empty,
  Tag,
  Spin,
  Modal,
} from "antd";
import {
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { FileText, User, Award,Sparkles, TrendingUp } from "lucide-react";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import useInterviewPersistence from "../../hooks/interviewee/useInterviewPersistence";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLatestInterview,
  resumeInterview,
  resetInterview,
} from "../../store/intervieweeSlice";
import { removeAbandonedAttempt } from "../../store/interviewerSlice";
import { STORAGE_KEYS } from "../../utils/storageUtils";
import ResumeInterviewModal from "../../components/ResumeInterviewModal/ResumeInterviewModal";
import { useNavigate } from "react-router-dom";
const { Title, Text, Paragraph } = Typography;

/**
 * Dashboard page for interviewees
 * Professional interface showing resume status, profile, and interview history
 */
const DashboardPage = () => {
  const dispatch = useDispatch();
  const {
    profile,
    resume,
    pastInterviews,
    finalScore,
    finalSummary,
    status,
    handleStartNewInterview,
    handleViewResults,
    handleResumeInterview,
  } = useInterviewFlow();

  const { resumableInterviewInfo } = useInterviewPersistence();
  const latestInterview = useSelector(selectLatestInterview);
  // Removed dashboardLoading in favor of global loading state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check for resumable interviews after a small delay
      if (resumableInterviewInfo) {
        console.log("Found in-progress interview, showing resume modal");
        setShowResumeModal(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [resumableInterviewInfo]);

  const hasCompletedInterviews =
    (pastInterviews && pastInterviews.length > 0) ||
    status === "completed" ||
    finalScore !== null;

  const getLatestInterviewData = () => {
    if (status === "completed" && finalScore !== null) {
      return {
        score: finalScore,
        summary: finalSummary,
        date: new Date().toISOString(),
        isCurrentSession: true,
      };
    } else if (latestInterview) {
      return {
        score: latestInterview.finalScore,
        summary: latestInterview.finalSummary,
        date: latestInterview.completedAt || latestInterview.interviewStartTime,
        isCurrentSession: false,
      };
    }
    return null;
  };

  // Removed dashboardLoading check in favor of global loading state

  const latestInterviewData = getLatestInterviewData();

  const handleStartNewFromModal = () => {
    if (resumableInterviewInfo?.interviewId) {
      console.log(
        "Starting new interview from dashboard, clearing old progress for:",
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
    // Finally, navigate to the start page
    handleStartNewInterview();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <Title level={2} className="!mb-0 !text-2xl !font-bold">
                    Welcome{profile?.name ? `, ${profile.name}` : ""}!
                  </Title>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-lg border border-violet-100">
                      <Award className="w-3.5 h-3.5 text-violet-600" />
                      <Text className="text-sm font-semibold text-violet-700">
                        {pastInterviews?.length || 0}{" "}
                        {pastInterviews?.length === 1
                          ? "Interview"
                          : "Interviews"}
                      </Text>
                    </div>
                    <Text className="text-gray-500 text-sm">completed</Text>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleStartNewInterview}
                className="hidden md:flex items-center"
              >
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Row gutter={[16, 16]} className="mb-6">
          {/* Quick Stats Cards */}
          <Col xs={24} md={8}>
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/interviewee/settings")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SettingOutlined className="text-purple-600" />
                    </div>
                    <Text className="font-semibold text-gray-700">
                      Interview Settings
                    </Text>
                  </div>
                  <Text className="text-sm text-gray-600 block mb-3">
                    Customize interview duration, complexity, and focus areas
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SettingOutlined />}
                    className="flex items-center"
                  >
                    Configure Settings
                  </Button>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <Text className="font-semibold text-gray-700">
                      Resume Status
                    </Text>
                  </div>
                  {resume?.text ? (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text className="text-sm font-medium text-gray-900">
                          Uploaded
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 block mb-3">
                        {resume.fileName}
                      </Text>
                      <Button size="small" onClick={handleStartNewInterview}>
                        Update Resume
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockCircleOutlined className="text-orange-500" />
                        <Text className="text-sm font-medium text-gray-900">
                          Not Uploaded
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 block mb-3">
                        Upload to start practicing
                      </Text>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleStartNewInterview}
                      >
                        Upload Now
                      </Button>
                    </>
                  )}
                </div>
                <Tag color={resume?.text ? "success" : "warning"}>
                  {resume?.text ? "Ready" : "Required"}
                </Tag>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <Text className="font-semibold text-gray-700">Profile</Text>
                  </div>
                  {profile?.name ? (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text className="text-sm font-medium text-gray-900">
                          Complete
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 block truncate">
                        {profile.email || "No email provided"}
                      </Text>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockCircleOutlined className="text-orange-500" />
                        <Text className="text-sm font-medium text-gray-900">
                          Incomplete
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 block mb-3">
                        Complete your profile
                      </Text>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleStartNewInterview}
                      >
                        Complete Now
                      </Button>
                    </>
                  )}
                </div>
                <Tag color={profile?.name ? "success" : "warning"}>
                  {profile?.name ? "Ready" : "Required"}
                </Tag>
              </div>
            </div>
          </Col>
          {/* Latest Interview Results */}
          <Col span={24}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrophyOutlined className="text-yellow-500 text-lg" />
                    <Title level={4} className="m-0">
                      Latest Interview Results
                    </Title>
                  </div>
                  {hasCompletedInterviews && (
                    <Button
                      type="link"
                      onClick={() => handleViewResults()}
                      icon={<EyeOutlined />}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {latestInterviewData ? (
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={6}>
                      <div className="text-center lg:text-left">
                        <Text className="text-sm text-gray-500 block mb-2">
                          Your Score
                        </Text>
                        <div className="flex items-baseline justify-center lg:justify-start space-x-1">
                          <Text
                            className="text-4xl font-bold"
                            style={{
                              color:
                                latestInterviewData.score >= 80
                                  ? "#52c41a"
                                  : latestInterviewData.score >= 60
                                  ? "#faad14"
                                  : "#ff4d4f",
                            }}
                          >
                            {latestInterviewData.score}
                          </Text>
                          <Text className="text-xl text-gray-400">/ 100</Text>
                        </div>
                        <div className="mt-2">
                          <Tag
                            color={
                              latestInterviewData.score >= 80
                                ? "success"
                                : latestInterviewData.score >= 60
                                ? "warning"
                                : "error"
                            }
                          >
                            {latestInterviewData.score >= 80
                              ? "Excellent"
                              : latestInterviewData.score >= 60
                              ? "Good"
                              : "Needs Improvement"}
                          </Tag>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} lg={12}>
                      <div>
                        <Text className="text-sm font-semibold text-gray-700 block mb-2">
                          Summary
                        </Text>
                        <Paragraph
                          ellipsis={{ rows: 3 }}
                          className="text-gray-600 text-sm leading-relaxed"
                        >
                          {latestInterviewData.summary ||
                            "No detailed feedback available for this interview."}
                        </Paragraph>
                      </div>
                    </Col>

                    <Col xs={24} lg={6}>
                      <div className="flex flex-col justify-center h-full">
                        <div className="flex items-center justify-center lg:justify-end space-x-2 text-gray-500 mb-2">
                          <CalendarOutlined />
                          <Text className="text-sm">
                            {new Date(
                              latestInterviewData.date
                            ).toLocaleDateString()}
                          </Text>
                        </div>
                        {latestInterviewData.isCurrentSession && (
                          <div className="flex justify-center lg:justify-end">
                            <Tag color="blue">Current Session</Tag>
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col span={24}>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleStartNewInterview}
                          icon={<ArrowRightOutlined />}
                        >
                          Start New Interview
                        </Button>
                        <Button
                          size="large"
                          onClick={() => handleViewResults()}
                          icon={<TrendingUp className="w-4 h-4" />}
                        >
                          View Detailed Feedback
                        </Button>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="py-8">
                        <Text className="text-gray-500 block mb-2">
                          You haven't completed any interviews yet
                        </Text>
                        <Text className="text-sm text-gray-400">
                          Start your first interview to receive feedback and
                          improve your skills
                        </Text>
                      </div>
                    }
                  >
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleStartNewInterview}
                      icon={<ArrowRightOutlined />}
                    >
                      Start Your First Interview
                    </Button>
                  </Empty>
                )}
              </div>
            </div>
          </Col>

          {/* Interview History */}
          {pastInterviews && pastInterviews.length > 0 && (
            <Col span={24}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <HistoryOutlined className="text-gray-600" />
                    <Title level={4} className="m-0">
                      Interview History
                    </Title>
                  </div>
                </div>

                <div className="p-6">
                  <List
                    dataSource={pastInterviews.slice(0, 5)}
                    renderItem={(interview) => (
                      <List.Item
                        className="px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                        actions={[
                          <Button
                            key="view"
                            type="link"
                            size="small"
                            onClick={() => handleViewResults(interview.id)}
                            icon={<EyeOutlined />}
                          >
                            View
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-lg flex items-center justify-center">
                              <Award className="w-6 h-6 text-violet-600" />
                            </div>
                          }
                          title={
                            <div className="flex items-center space-x-2">
                              <Text className="font-medium">
                                {(() => {
                                  // Format the date safely
                                  const dateValue =
                                    interview.completedAt ||
                                    interview.interviewStartTime ||
                                    interview.timestamp ||
                                    Date.now();
                                  try {
                                    return new Date(
                                      dateValue
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    });
                                  } catch (err) {
                                    console.warn(
                                      "Invalid date value:",
                                      dateValue
                                    );
                                    return new Date().toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    );
                                  }
                                })()}
                              </Text>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <Tag
                                  color={
                                    interview.finalScore >= 80
                                      ? "success"
                                      : interview.finalScore >= 60
                                      ? "warning"
                                      : "error"
                                  }
                                >
                                  Score: {interview.finalScore}
                                </Tag>
                                {interview.completionRatio !== undefined && (
                                  <Tag
                                    color={
                                      interview.completionRatio === 100
                                        ? "blue"
                                        : "orange"
                                    }
                                  >
                                    {interview.completionRatio}% Completed
                                  </Tag>
                                )}
                              </div>
                            </div>
                          }
                          description={
                            <Text className="text-sm text-gray-500">
                              {interview.finalSummary
                                ? interview.finalSummary.substring(0, 100) +
                                  "..."
                                : "No summary available"}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />

                  {pastInterviews.length > 5 && (
                    <div className="text-center mt-6 pt-4 border-t border-gray-100">
                      <Button onClick={() => handleViewResults()}>
                        View All Interviews ({pastInterviews.length})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* Mobile FAB for Start Interview */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button
          type="primary"
          size="large"
          shape="circle"
          icon={<ArrowRightOutlined />}
          onClick={handleStartNewInterview}
          className="w-14 h-14 shadow-lg"
        />
      </div>

      {/* Resume Interview Modal */}
      <ResumeInterviewModal
        open={showResumeModal}
        onStartNew={handleStartNewFromModal}
        onResume={handleResumeClick}
        loading={resumeLoading}
        resumableInfo={resumableInterviewInfo}
      />
    </div>
  );

  // Function to handle resuming the interview with loading state
  function handleResumeClick() {
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
    } catch (error) {
      console.error("Failed to resume interview:", error);
      // If resume fails, close modal and show error
      message.error(
        "Failed to resume interview. Please try starting a new one."
      );
      setShowResumeModal(false);
      setResumeLoading(false);
    }
  }
};

export default DashboardPage;
