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
  Empty,
  Statistic,
  Tag,
  Badge,
  Tooltip,
  Alert,
  Spin,
} from "antd";
import {
  FileAddOutlined,
  HistoryOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import { useSelector } from "react-redux";
import { selectLatestInterview } from "../../store/intervieweeSlice";

const { Title, Text, Paragraph } = Typography;

/**
 * Dashboard page for interviewees
 * Shows past interviews, resume status, and actions to start new interviews
 */
const DashboardPage = () => {
  const {
    profile,
    resume,
    pastInterviews,
    finalScore,
    finalSummary,
    status,
    handleStartNewInterview,
    handleViewResults,
  } = useInterviewFlow();

  const latestInterview = useSelector(selectLatestInterview);

  // Local state
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Initialize dashboard
  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setDashboardLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
        date: latestInterview.completedAt || latestInterview.interviewStartTime,
        isCurrentSession: false,
      };
    }

    // No interview data
    return null;
  };

  // Show loading state
  if (dashboardLoading) {
    return (
      <div className="p-8 text-center">
        <Spin size="large" />
        <div className="mt-4">
          <Text type="secondary">Loading dashboard...</Text>
        </div>
      </div>
    );
  }

  const latestInterviewData = getLatestInterviewData();

  return (
    <div className="p-8">
      <Row gutter={[24, 24]}>
        {/* Welcome Section */}
        <Col span={24}>
          <Card className="shadow-sm">
            <Row align="middle" gutter={[24, 0]}>
              <Col xs={24} md={16}>
                <Title level={2} className="mb-2">
                  Welcome{profile?.name ? `, ${profile.name}` : ""}!
                </Title>
                <Paragraph className="text-lg text-slate-600">
                  Practice your interview skills with our AI-powered mock
                  interviewer.
                  {profile?.name
                    ? " Your profile is ready."
                    : " Start by uploading your resume."}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} className="text-right">
                <Button
                  type="primary"
                  size="large"
                  icon={<FileAddOutlined />}
                  onClick={handleStartNewInterview}
                >
                  Start New Interview
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Status Cards */}
        <Col xs={24} md={12}>
          <Card title="Your Resume" className="h-full shadow-sm">
            {resume?.text ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Space>
                    <Badge status="success" />
                    <Text strong>Resume Uploaded</Text>
                  </Space>
                  <Tag color="green">Ready</Tag>
                </div>
                <Paragraph className="mb-4 text-slate-500">
                  You've uploaded: <strong>{resume.fileName}</strong>
                </Paragraph>
                <Button
                  onClick={handleStartNewInterview}
                  type="default"
                  className="mt-2"
                >
                  Update Resume
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Space>
                    <Badge status="warning" />
                    <Text strong>No Resume</Text>
                  </Space>
                  <Tag color="orange">Required</Tag>
                </div>
                <Paragraph className="mb-4 text-slate-500">
                  Upload your resume to start practicing interviews
                </Paragraph>
                <Button
                  type="primary"
                  onClick={handleStartNewInterview}
                  className="mt-2"
                >
                  Upload Resume
                </Button>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Your Profile" className="h-full shadow-sm">
            {profile?.name ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Space>
                    <Badge status="success" />
                    <Text strong>Profile Complete</Text>
                  </Space>
                  <Tag color="green">Ready</Tag>
                </div>
                <ul className="list-none p-0 m-0">
                  <li className="mb-2">
                    <Text className="text-slate-500">
                      Name: <strong>{profile.name}</strong>
                    </Text>
                  </li>
                  <li className="mb-2">
                    <Text className="text-slate-500">
                      Email: <strong>{profile.email || "Not provided"}</strong>
                    </Text>
                  </li>
                  <li>
                    <Text className="text-slate-500">
                      Phone: <strong>{profile.phone || "Not provided"}</strong>
                    </Text>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Space>
                    <Badge status="warning" />
                    <Text strong>Profile Incomplete</Text>
                  </Space>
                  <Tag color="orange">Required</Tag>
                </div>
                <Paragraph className="mb-4 text-slate-500">
                  Complete your profile information to personalize your
                  interview experience
                </Paragraph>
                <Button
                  type="primary"
                  onClick={handleStartNewInterview}
                  className="mt-2"
                >
                  Complete Profile
                </Button>
              </>
            )}
          </Card>
        </Col>

        {/* Latest Interview Results */}
        <Col span={24}>
          <Card
            title={
              <div className="flex items-center">
                <TrophyOutlined className="mr-2 text-yellow-500" />
                <span>Latest Interview Results</span>
              </div>
            }
            className="shadow-sm"
            extra={
              hasCompletedInterviews ? (
                <Button
                  type="link"
                  onClick={handleViewResults}
                  icon={<EyeOutlined />}
                >
                  View Details
                </Button>
              ) : null
            }
          >
            {latestInterviewData ? (
              <Row gutter={[24, 24]}>
                <Col xs={24} md={6}>
                  <Statistic
                    title="Your Score"
                    value={latestInterviewData.score}
                    suffix="/ 100"
                    valueStyle={{
                      color:
                        latestInterviewData.score >= 80
                          ? "#3f8600"
                          : latestInterviewData.score >= 60
                          ? "#faad14"
                          : "#cf1322",
                    }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Title level={5}>Summary</Title>
                  <Paragraph ellipsis={{ rows: 3 }} className="text-slate-600">
                    {latestInterviewData.summary ||
                      "No detailed feedback available for this interview."}
                  </Paragraph>
                </Col>
                <Col xs={24} md={6}>
                  <div className="flex flex-col h-full justify-center items-center">
                    <div className="text-center">
                      <div className="text-slate-500 mb-1">
                        <CalendarOutlined className="mr-1" />
                        {new Date(
                          latestInterviewData.date
                        ).toLocaleDateString()}
                      </div>
                      {latestInterviewData.isCurrentSession && (
                        <Tag color="blue">Current Session</Tag>
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <Divider className="my-2" />
                  <div className="text-center">
                    <Button
                      type="primary"
                      onClick={handleStartNewInterview}
                      className="mr-4"
                    >
                      Start New Interview
                    </Button>
                    <Button onClick={handleViewResults}>
                      View Detailed Feedback
                    </Button>
                  </div>
                </Col>
              </Row>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-500">
                    You haven't completed any interviews yet.
                    <br />
                    Start an interview to receive feedback and improve your
                    skills!
                  </span>
                }
              >
                <Button type="primary" onClick={handleStartNewInterview}>
                  Start Your First Interview
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        {/* Past Interviews (Only show if there are past interviews) */}
        {pastInterviews && pastInterviews.length > 0 && (
          <Col span={24}>
            <Card
              title={
                <div className="flex items-center">
                  <HistoryOutlined className="mr-2" />
                  <span>Interview History</span>
                </div>
              }
              className="shadow-sm"
            >
              <List
                dataSource={pastInterviews.slice(0, 5)}
                renderItem={(interview) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        size="small"
                        onClick={() => handleViewResults(interview.id)}
                      >
                        View
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center">
                          <span>
                            Interview on{" "}
                            {new Date(
                              interview.completedAt ||
                                interview.interviewStartTime
                            ).toLocaleDateString()}
                          </span>
                          <Tag
                            color="green"
                            className="ml-2"
                          >{`Score: ${interview.finalScore}`}</Tag>
                        </div>
                      }
                      description={
                        interview.finalSummary
                          ? interview.finalSummary.substring(0, 100) + "..."
                          : "No summary available."
                      }
                    />
                  </List.Item>
                )}
              />

              {pastInterviews.length > 5 && (
                <div className="text-center mt-4">
                  <Button onClick={() => handleViewResults()}>
                    View All Interviews
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DashboardPage;
