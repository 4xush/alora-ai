import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  List,
  Modal,
  Empty,
  Popconfirm,
  Statistic,
  Tag,
  Badge,
  Tooltip,
  Alert,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  FileAddOutlined,
  HistoryOutlined,
  TrophyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  resetInterview,
  clearAllHistory,
  setCurrentStep,
  viewPastInterview,
  selectPastInterviews,
  selectLatestInterview,
  selectProfile,
} from "../../store/intervieweeSlice.js";

const { Title, Text, Paragraph } = Typography;

const IntervieweeDashboard = ({ onStartNewInterview, onViewResults }) => {
  const dispatch = useDispatch();

  // Use selectors for better state access
  const profile = useSelector(selectProfile);
  const pastInterviews = useSelector(selectPastInterviews);
  const latestInterview = useSelector(selectLatestInterview);
  const { finalScore, finalSummary, status, loading, error, resume } =
    useSelector((s) => s.interviewee);

  // Local state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Initialize dashboard
  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setDashboardLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("Dashboard state:", {
      profileName: profile?.name,
      pastInterviewsCount: pastInterviews?.length || 0,
      latestScore: latestInterview?.finalScore,
      status,
      hasResume: !!resume?.text,
    });
  }, [profile, pastInterviews, latestInterview, status, resume]);

  // Check if user has completed interviews
  const hasCompletedInterviews =
    (pastInterviews && pastInterviews.length > 0) ||
    status === "completed" ||
    finalScore !== null;

  // Get display data for latest interview
  const getLatestInterviewData = () => {
    if (status === "completed" && finalScore !== null) {
      // Current completed interview
      return {
        score: finalScore,
        summary: finalSummary,
        date: new Date().toISOString(),
        isCurrentSession: true,
      };
    } else if (latestInterview) {
      // Most recent past interview
      return {
        score: latestInterview.finalScore,
        summary: latestInterview.finalSummary,
        date: latestInterview.date,
        isCurrentSession: false,
      };
    }
    return null;
  };

  const latestData = getLatestInterviewData();

  // Calculate statistics
  const getStatistics = () => {
    if (!pastInterviews || pastInterviews.length === 0) {
      return {
        totalInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        completionRate: 0,
      };
    }

    const completedInterviews = pastInterviews.filter(
      (i) => i.finalScore !== null
    );
    const scores = completedInterviews
      .map((i) => i.finalScore)
      .filter((s) => s !== null);

    return {
      totalInterviews: pastInterviews.length,
      averageScore:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      completionRate:
        pastInterviews.length > 0
          ? Math.round(
              (completedInterviews.length / pastInterviews.length) * 100
            )
          : 0,
    };
  };

  const stats = getStatistics();

  // Event handlers
  const handleStartNewInterview = () => {
    console.log("Starting new interview from dashboard");

    try {
      // Set loading state first - this ensures the spinner shows
      setDashboardLoading(true);

      // Reset interview state immediately
      dispatch(resetInterview());

      // Signal intent to start new interview with a brief delay
      // This gives Redux state time to reset
      setTimeout(() => {
        // Directly invoke the parent handler which will handle the transition
        if (onStartNewInterview) {
          console.log(
            "IntervieweeDashboard: Calling parent onStartNewInterview handler"
          );
          onStartNewInterview();
        } else {
          console.warn(
            "IntervieweeDashboard: No onStartNewInterview handler provided"
          );
          setDashboardLoading(false); // Reset loading state if no handler
        }
      }, 50);
    } catch (error) {
      console.error(
        "IntervieweeDashboard: Error starting new interview:",
        error
      );
      setDashboardLoading(false);
      // Show error message
      message.error(
        "There was a problem starting the interview. Please try again."
      );
    }

    // Safety net: If we're still on the dashboard after a delay, reset loading state
    setTimeout(() => {
      if (document.getElementById("interviewee-dashboard-container")) {
        console.log(
          "IntervieweeDashboard: Still on dashboard after delay, resetting loading state"
        );
        setDashboardLoading(false);
      }
    }, 1000);
  };

  const handleViewLatestResults = () => {
    console.log("Viewing latest results");

    if (latestData?.isCurrentSession) {
      // Already showing current session results
      dispatch(setCurrentStep(3));
    } else if (latestInterview) {
      // Load past interview for viewing
      dispatch(viewPastInterview(latestInterview.id));
    }

    if (onViewResults) {
      onViewResults();
    }
  };

  const handleViewInterviewDetails = (interview) => {
    console.log("Viewing interview details:", interview.id);
    setSelectedInterview(interview);
  };

  const handleViewPastInterview = (interview) => {
    console.log("Loading past interview:", interview.id);
    dispatch(viewPastInterview(interview.id));
    setHistoryModalVisible(false);

    if (onViewResults) {
      onViewResults();
    }
  };

  const showHistoryModal = () => {
    setHistoryModalVisible(true);
  };

  const hideHistoryModal = () => {
    setHistoryModalVisible(false);
    setSelectedInterview(null);
  };

  const confirmClearHistory = () => {
    console.log("Clearing all interview history");
    dispatch(clearAllHistory());
    hideHistoryModal();
  };

  // Render score with color
  const renderScoreTag = (score) => {
    if (score === null || score === undefined)
      return <Text type="secondary">N/A</Text>;

    let color = "default";
    if (score >= 80) color = "green";
    else if (score >= 60) color = "blue";
    else if (score >= 40) color = "orange";
    else color = "red";

    return <Tag color={color}>{score}%</Tag>;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch (e) {
      return { date: "Unknown", time: "" };
    }
  };

  if (dashboardLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading your dashboard...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div id="interviewee-dashboard-container">
      {/* Header */}
      <Card bordered style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {profile?.name || pastInterviews?.length > 0 || resume?.text
                  ? `Welcome back${profile?.name ? `, ${profile.name}` : ""}!`
                  : "Welcome to Your Interview Practice!"}
              </Title>
              <Text type="secondary">
                {profile?.name || pastInterviews?.length > 0 || resume?.text
                  ? "Ready to take on your next interview challenge?"
                  : "Let's start by uploading your resume to create personalized questions."}
              </Text>
            </div>
            {profile?.email && <Badge status="success" text={profile.email} />}
          </div>

          {error && (
            <Alert
              message="Dashboard Error"
              description={error}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Space>
      </Card>

      {/* Statistics Overview */}
      {hasCompletedInterviews && (
        <Card title="Your Performance Overview" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Interviews"
                value={stats.totalInterviews}
                prefix={<QuestionCircleOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Best Score"
                value={stats.bestScore}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{
                  color: stats.bestScore >= 70 ? "#3f8600" : "#cf1322",
                }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Average Score"
                value={stats.averageScore}
                suffix="%"
                valueStyle={{
                  color: stats.averageScore >= 60 ? "#3f8600" : "#cf1322",
                }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completion Rate"
                value={stats.completionRate}
                suffix="%"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Actions */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileAddOutlined style={{ color: "#7c3aed" }} />
                {resume?.text || profile?.name
                  ? "Start New Interview"
                  : "Begin Your First Interview"}
              </Space>
            }
            bordered
            style={{ height: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                {resume?.text || profile?.name || pastInterviews?.length > 0
                  ? "Ready to test your skills? Start a fresh interview session with personalized questions based on your resume and experience level."
                  : "Welcome to your interview practice platform! Follow our guided process to upload your resume and complete a practice interview."}
              </Paragraph>

              {!resume?.text && (
                <Alert
                  message={
                    pastInterviews?.length > 0
                      ? "Resume Required"
                      : "Step 1: Upload Your Resume"
                  }
                  description="You'll need to upload your resume to get started with personalized questions tailored to your experience level."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Button
                type="primary"
                size="large"
                icon={<FileAddOutlined />}
                onClick={() => {
                  console.log("IntervieweeDashboard: Begin button clicked", {
                    loading,
                    dashboardLoading,
                    hasResume: !!resume?.text,
                  });
                  handleStartNewInterview();
                }}
                loading={loading}
                style={{ width: "100%" }}
              >
                {resume?.text || profile?.name || pastInterviews?.length > 0
                  ? "Start New Interview"
                  : "Begin Interview Process"}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: "#7c3aed" }} />
                {hasCompletedInterviews
                  ? "Previous Results"
                  : resume?.text
                  ? "Your Results"
                  : "Interview Process"}
              </Space>
            }
            bordered
            style={{ height: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {hasCompletedInterviews && latestData ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space align="center">
                      <TrophyOutlined
                        style={{
                          fontSize: "24px",
                          color:
                            latestData.score >= 70
                              ? "#52c41a"
                              : latestData.score >= 40
                              ? "#faad14"
                              : "#f5222d",
                        }}
                      />
                      <div>
                        <Text strong style={{ fontSize: "18px" }}>
                          Latest Score: {renderScoreTag(latestData.score)}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {formatDate(latestData.date).date}
                        </Text>
                      </div>
                    </Space>
                  </div>

                  <Paragraph
                    type="secondary"
                    style={{ marginTop: 8, fontSize: "14px" }}
                    ellipsis={{ rows: 2, expandable: false }}
                  >
                    {latestData.summary || "No summary available."}
                  </Paragraph>

                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Button
                      icon={<EyeOutlined />}
                      onClick={handleViewLatestResults}
                    >
                      View Details
                    </Button>

                    {pastInterviews && pastInterviews.length > 1 && (
                      <Button
                        onClick={showHistoryModal}
                        icon={<ClockCircleOutlined />}
                      >
                        History ({pastInterviews.length})
                      </Button>
                    )}
                  </Space>
                </>
              ) : (
                <>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      resume?.text
                        ? "No interviews completed yet"
                        : "Start your first interview"
                    }
                    style={{ margin: "16px 0" }}
                  />
                  {resume?.text ? (
                    <Text type="secondary">
                      Complete your first interview to see detailed results and
                      track your progress over time.
                    </Text>
                  ) : (
                    <div>
                      <Alert
                        message="How It Works"
                        description={
                          <ol>
                            <li>Upload your resume</li>
                            <li>Verify your personal information</li>
                            <li>Take a tailored MCQ test</li>
                            <li>Get detailed feedback and insights</li>
                          </ol>
                        }
                        type="success"
                        showIcon
                      />
                    </div>
                  )}
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Clear History Option */}
      {hasCompletedInterviews &&
        pastInterviews &&
        pastInterviews.length > 0 && (
          <Card size="small">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>Manage Your Data</Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Clear all interview history if you want to start fresh
                </Text>
              </div>
              <Popconfirm
                title="Clear Interview History"
                description="Are you sure you want to delete all your interview history? This action cannot be undone."
                onConfirm={confirmClearHistory}
                okText="Yes, Clear All"
                cancelText="Cancel"
                icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Clear History
                </Button>
              </Popconfirm>
            </div>
          </Card>
        )}

      {/* Interview History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            Interview History
            <Badge count={pastInterviews?.length || 0} showZero />
          </Space>
        }
        open={historyModalVisible}
        onCancel={hideHistoryModal}
        footer={[
          <Button key="close" onClick={hideHistoryModal}>
            Close
          </Button>,
        ]}
        width={800}
        styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
      >
        {pastInterviews && pastInterviews.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={pastInterviews}
            renderItem={(interview, index) => {
              const { date, time } = formatDate(interview.date);
              const duration =
                interview.endTime && interview.startTime
                  ? Math.round(
                      (new Date(interview.endTime) -
                        new Date(interview.startTime)) /
                        (1000 * 60)
                    )
                  : null;

              return (
                <List.Item
                  key={interview.id}
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewPastInterview(interview)}
                    >
                      View Details
                    </Button>,
                    <Tooltip title="View quick summary">
                      <Button
                        key="summary"
                        type="link"
                        icon={<QuestionCircleOutlined />}
                        onClick={() => handleViewInterviewDetails(interview)}
                      >
                        Summary
                      </Button>
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ textAlign: "center" }}>
                        <TrophyOutlined
                          style={{
                            fontSize: "32px",
                            color:
                              interview.finalScore >= 70
                                ? "#52c41a"
                                : interview.finalScore >= 50
                                ? "#faad14"
                                : "#f5222d",
                          }}
                        />
                        <div style={{ fontSize: "12px", marginTop: 4 }}>
                          {renderScoreTag(interview.finalScore)}
                        </div>
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong>
                          Interview #{pastInterviews.length - index}
                        </Text>
                        <Text type="secondary">•</Text>
                        <Space size={4}>
                          <CalendarOutlined style={{ fontSize: "12px" }} />
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {date} at {time}
                          </Text>
                        </Space>
                      </Space>
                    }
                    description={
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: "100%" }}
                      >
                        <Space>
                          <Text type="secondary">Questions:</Text>
                          <Text>{interview.questions?.length || 0}</Text>
                          <Divider type="vertical" />
                          <Text type="secondary">Answers:</Text>
                          <Text>{interview.answers?.length || 0}</Text>
                          {duration && (
                            <>
                              <Divider type="vertical" />
                              <Text type="secondary">Duration:</Text>
                              <Text>{duration} min</Text>
                            </>
                          )}
                        </Space>
                        {interview.finalSummary && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2, expandable: false }}
                            style={{ fontSize: "12px", margin: 0 }}
                          >
                            {interview.finalSummary}
                          </Paragraph>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            description="No interview history found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Modal>

      {/* Interview Details Modal */}
      <Modal
        title="Interview Summary"
        open={!!selectedInterview}
        onCancel={() => setSelectedInterview(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedInterview(null)}>
            Close
          </Button>,
          <Button
            key="view"
            type="primary"
            onClick={() => {
              handleViewPastInterview(selectedInterview);
              setSelectedInterview(null);
            }}
          >
            View Full Details
          </Button>,
        ]}
        width={600}
      >
        {selectedInterview && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Final Score"
                  value={selectedInterview.finalScore || 0}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Questions Answered"
                  value={selectedInterview.answers?.length || 0}
                  suffix={`/ ${selectedInterview.questions?.length || 0}`}
                  prefix={<QuestionCircleOutlined />}
                />
              </Col>
            </Row>

            <Divider />

            <div>
              <Title level={5}>Summary</Title>
              <Paragraph>
                {selectedInterview.finalSummary || "No summary available."}
              </Paragraph>
            </div>

            <div>
              <Title level={5}>Interview Date</Title>
              <Text>
                {formatDate(selectedInterview.date).date} at{" "}
                {formatDate(selectedInterview.date).time}
              </Text>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default IntervieweeDashboard;
