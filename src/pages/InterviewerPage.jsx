import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Typography,
  Button,
  Badge,
  Tag,
  Avatar,
  Drawer,
  Tabs,
  Card,
  Statistic,
  List,
  Space,
  Row,
  Col,
  Input,
  Collapse,
  Empty,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { clearAllCandidates } from "../store/interviewerSlice";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Enhanced Interviewer Dashboard with Production-Grade Detail Drawer
 * Now with candidate-centric implementation
 */
const InterviewerPage = () => {
  const dispatch = useDispatch();
  const { candidates, search, sortKey, sortOrder } = useSelector(
    (s) => s.interviewer
  );

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Process data to be candidate-centric
  const processedData = useMemo(() => {
    // Create an array of unique candidates with their stats
    return candidates
      .map((candidate) => {
        // Find the best score among all attempts
        const allScores =
          candidate.attempts?.map((a) => a.score).filter((s) => s != null) ||
          [];
        const bestScore = allScores.length > 0 ? Math.max(...allScores) : null;

        // Find latest attempt date
        const sortedAttempts = [...(candidate.attempts || [])].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        const latestAttempt = sortedAttempts[0] || {};

        // Calculate total completed interviews
        const completedAttempts = (candidate.attempts || []).filter(
          (a) => a.status === "Completed"
        ).length;

        // Calculate average score
        const avgScore =
          allScores.length > 0
            ? Math.round(
                allScores.reduce((a, b) => a + b, 0) / allScores.length
              )
            : null;

        return {
          key: candidate.email,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          totalAttempts: candidate.attempts?.length || 1,
          completedAttempts: completedAttempts,
          bestScore: bestScore,
          avgScore: avgScore,
          latestStatus: candidate.latestStatus || latestAttempt.status,
          latestDate: latestAttempt.createdAt || latestAttempt.interviewDate,
          allAttempts: candidate.attempts || [
            { ...candidate, attemptNumber: 1 },
          ],
        };
      })
      .filter((candidate) => {
        // Apply search filter
        if (search) {
          return (
            candidate.candidateName
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            candidate.candidateEmail
              ?.toLowerCase()
              .includes(search.toLowerCase())
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by best score by default
        if (sortKey === "bestScore") {
          const scoreA = a.bestScore ?? -1;
          const scoreB = b.bestScore ?? -1;
          return sortOrder === "ascend" ? scoreA - scoreB : scoreB - scoreA;
        }
        // Handle other sort keys
        if (sortKey === "candidateName") {
          return sortOrder === "ascend"
            ? a.candidateName.localeCompare(b.candidateName)
            : b.candidateName.localeCompare(a.candidateName);
        }
        if (sortKey === "latestDate") {
          const dateA = new Date(a.latestDate || 0);
          const dateB = new Date(b.latestDate || 0);
          return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
        }
        if (sortKey === "avgScore") {
          const avgA = a.avgScore ?? -1;
          const avgB = b.avgScore ?? -1;
          return sortOrder === "ascend" ? avgA - avgB : avgB - avgA;
        }
        // Default sort by best score descending
        const scoreA = a.bestScore ?? -1;
        const scoreB = b.bestScore ?? -1;
        return scoreB - scoreA;
      });
  }, [candidates, search, sortKey, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalCandidates: candidates.length,
      totalInterviews: candidates.reduce(
        (sum, c) => sum + (c.attempts?.length || 1),
        0
      ),
      averageScore: (() => {
        const scores = candidates
          .map((c) => c.latestScore)
          .filter((s) => s != null);
        return scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;
      })(),
      completedInterviews: candidates.reduce(
        (sum, c) =>
          sum +
          (c.attempts || []).filter((a) => a.status === "Completed").length,
        0
      ),
    };
  }, [candidates]);

  // Calculate detailed analytics for selected candidate
  const candidateAnalytics = useMemo(() => {
    if (!selectedCandidate) return null;

    const attempts = selectedCandidate.allAttempts || [];
    const questionData = attempts.flatMap(
      (attempt) =>
        attempt.questions?.map((q) => ({
          ...q,
          attemptId: attempt.id,
          attemptNumber: attempt.attemptNumber,
        })) || []
    );

    return {
      totalQuestions: questionData.length,
      questionsByDifficulty: {
        easy: questionData.filter((q) => q.difficulty === "Easy").length,
        medium: questionData.filter((q) => q.difficulty === "Medium").length,
        hard: questionData.filter((q) => q.difficulty === "Hard").length,
      },
      averageResponseTime: questionData.length
        ? Math.round(
            questionData.reduce((sum, q) => sum + (q.responseTime || 0), 0) /
              questionData.length
          )
        : 0,
    };
  }, [selectedCandidate]);

  // Handler for viewing attempt details
  const handleViewAttemptDetails = (attempt) => {
    setSelectedAttempt(attempt);
    // Switch to the attempt details tab if needed
    setActiveTab("2");
  };

  // Helper functions
  const getStatusBadge = (status) => {
    if (!status) return <Badge status="default" text="Unknown" />;

    switch (status) {
      case "Completed":
        return <Badge status="success" text="Completed" />;
      case "In Progress":
        return <Badge status="processing" text="In Progress" />;
      case "Abandoned":
        return <Badge status="error" text="Abandoned" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const getScoreTag = (score) => {
    if (score === null || score === undefined) return <Tag>No Score</Tag>;

    if (score >= 80) return <Tag color="success">{score}%</Tag>;
    if (score >= 60) return <Tag color="blue">{score}%</Tag>;
    if (score >= 40) return <Tag color="warning">{score}%</Tag>;
    return <Tag color="error">{score}%</Tag>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Updated columns to be candidate-centric
  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "candidateName",
      sorter: true,
      render: (text, record) => (
        <div className="flex items-center">
          <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.candidateEmail}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Interview Stats",
      key: "interviewStats",
      render: (_, record) => (
        <div>
          <div className="text-sm">
            {record.totalAttempts}{" "}
            {record.totalAttempts === 1 ? "attempt" : "attempts"}
          </div>
          <div className="text-xs text-gray-500">
            {record.completedAttempts} completed
          </div>
        </div>
      ),
    },
    {
      title: "Best Score",
      key: "bestScore",
      sorter: true,
      defaultSortOrder: "descend",
      render: (_, record) => getScoreTag(record.bestScore),
    },
    {
      title: "Average Score",
      key: "avgScore",
      sorter: true,
      render: (_, record) => getScoreTag(record.avgScore),
    },
    {
      title: "Latest Status",
      dataIndex: "latestStatus",
      key: "latestStatus",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Last Interview",
      key: "latestDate",
      sorter: true,
      render: (_, record) => (
        <div className="text-sm">{formatDate(record.latestDate)}</div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCandidate({ ...record, attempts: record.allAttempts });
            setDrawerVisible(true);
          }}
        >
          View Profile
        </Button>
      ),
    },
  ];

  // Render function
  return (
    <div className="p-4 space-y-4">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>Interviewer Dashboard</span>
            <div className="space-x-2">
              <Input.Search
                placeholder="Search candidates..."
                style={{ width: 250 }}
                allowClear
                onChange={(e) =>
                  dispatch({
                    type: "interviewer/setSearch",
                    payload: e.target.value,
                  })
                }
                prefix={<SearchOutlined />}
              />
            </div>
          </div>
        }
      >
        <div className="mb-4">
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Candidates"
                  value={stats.totalCandidates}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Interviews"
                  value={stats.totalInterviews}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Completed Interviews"
                  value={stats.completedInterviews}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Average Score"
                  value={stats.averageScore || "N/A"}
                  suffix="%"
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={processedData}
          rowKey="candidateEmail"
          onChange={(pagination, filters, sorter) => {
            dispatch({
              type: "interviewer/setSort",
              payload: {
                key: sorter.field || "bestScore",
                order: sorter.order || "descend",
              },
            });
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} candidates`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No candidates found"
              />
            ),
          }}
        />
      </Card>

      {/* Candidate Detail Drawer */}
      <Drawer
        title="Candidate Details"
        placement="right"
        size="large"
        onClose={() => {
          setDrawerVisible(false);
          setSelectedCandidate(null);
          setSelectedAttempt(null);
        }}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Close</Button>
          </Space>
        }
      >
        {selectedCandidate ? (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "1",
                label: "Candidate Profile",
                children: (
                  <div className="h-full flex flex-col">
                    {/* Header with candidate info */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar
                          size={64}
                          icon={<UserOutlined />}
                          className="bg-white text-blue-500"
                        />
                        <div className="flex-1">
                          <Title level={3} className="!text-white !mb-1">
                            {selectedCandidate.candidateName}
                          </Title>
                          <Space direction="vertical" size={0}>
                            <Text className="text-blue-100">
                              <MailOutlined className="mr-2" />
                              {selectedCandidate.candidateEmail}
                            </Text>
                            {selectedCandidate.candidatePhone && (
                              <Text className="text-blue-100">
                                <PhoneOutlined className="mr-2" />
                                {selectedCandidate.candidatePhone}
                              </Text>
                            )}
                          </Space>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Statistics */}
                    <Card
                      title="Candidate Overview"
                      size="small"
                      className="mt-4"
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Statistic
                            title="Total Interviews"
                            value={selectedCandidate.totalAttempts}
                            prefix={<TeamOutlined />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Best Score"
                            value={selectedCandidate.bestScore || "N/A"}
                            suffix="%"
                            valueStyle={{ color: "#52c41a" }}
                            prefix={<TrophyOutlined />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Average Score"
                            value={selectedCandidate.avgScore || "N/A"}
                            suffix="%"
                            valueStyle={{ color: "#1890ff" }}
                            prefix={<BarChartOutlined />}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* List of all interview attempts */}
                    <Card
                      title="Interview History"
                      size="small"
                      className="mt-4"
                    >
                      <List
                        dataSource={selectedCandidate.allAttempts}
                        renderItem={(attempt, index) => (
                          <List.Item
                            key={attempt.id || index}
                            actions={[
                              <Button
                                key="view"
                                type="link"
                                onClick={() =>
                                  handleViewAttemptDetails(attempt)
                                }
                              >
                                View Details
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor:
                                      attempt.status === "Completed"
                                        ? "#52c41a"
                                        : "#1890ff",
                                  }}
                                >
                                  #{attempt.attemptNumber || index + 1}
                                </Avatar>
                              }
                              title={
                                <div className="flex justify-between items-center">
                                  <span>
                                    {formatDate(
                                      attempt.createdAt || attempt.interviewDate
                                    )}
                                  </span>
                                  {attempt.score !== null &&
                                    getScoreTag(attempt.score)}
                                </div>
                              }
                              description={
                                <div>
                                  <div className="flex justify-between">
                                    <span>
                                      Status: {getStatusBadge(attempt.status)}
                                    </span>
                                    <span>
                                      {attempt.answeredQuestions || 0}/
                                      {attempt.totalQuestions || "?"} questions
                                    </span>
                                  </div>
                                  {attempt.summary && (
                                    <Paragraph
                                      ellipsis={{ rows: 2 }}
                                      className="text-xs mt-1 text-gray-600"
                                    >
                                      {attempt.summary}
                                    </Paragraph>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </div>
                ),
              },
              {
                key: "2",
                label: "Interview Details",
                children: (
                  <div>
                    {selectedAttempt ? (
                      <div>
                        <Card
                          title={`Interview #${
                            selectedAttempt.attemptNumber || 1
                          } Details`}
                          size="small"
                        >
                          <div className="mb-4">
                            <Row gutter={16}>
                              <Col span={8}>
                                <Statistic
                                  title="Date"
                                  value={formatDate(
                                    selectedAttempt.createdAt ||
                                      selectedAttempt.interviewDate
                                  )}
                                  valueStyle={{ fontSize: "14px" }}
                                />
                              </Col>
                              <Col span={8}>
                                <Statistic
                                  title="Status"
                                  value={selectedAttempt.status || "Unknown"}
                                  valueStyle={{ fontSize: "14px" }}
                                />
                              </Col>
                              <Col span={8}>
                                <Statistic
                                  title="Score"
                                  value={selectedAttempt.score || "N/A"}
                                  suffix="%"
                                  valueStyle={{ fontSize: "14px" }}
                                />
                              </Col>
                            </Row>
                          </div>

                          {selectedAttempt.summary && (
                            <Card
                              size="small"
                              title="AI Summary"
                              className="mb-4"
                            >
                              <Paragraph>{selectedAttempt.summary}</Paragraph>
                            </Card>
                          )}

                          {/* Questions and Answers */}
                          <Card
                            size="small"
                            title="Interview Transcript"
                            className="mb-4"
                          >
                            {selectedAttempt.questions ? (
                              selectedAttempt.questions.map((q, index) => (
                                <div key={index} className="mb-4 border-b pb-4">
                                  <Title level={5} className="mb-2">
                                    Q{index + 1}: {q.question}
                                  </Title>
                                  <Tag
                                    color={
                                      q.difficulty === "Easy"
                                        ? "green"
                                        : q.difficulty === "Medium"
                                        ? "blue"
                                        : "red"
                                    }
                                  >
                                    {q.difficulty}
                                  </Tag>
                                  <Tag>
                                    Response time:{" "}
                                    {formatDuration(q.responseTime)}
                                  </Tag>

                                  <div className="mt-2">
                                    <Text strong>Candidate's Answer:</Text>
                                    <div className="bg-gray-50 p-2 mt-1 rounded">
                                      {q.answer || (
                                        <Text italic>No answer provided</Text>
                                      )}
                                    </div>
                                  </div>

                                  {q.evaluation && (
                                    <div className="mt-2">
                                      <Text strong>AI Evaluation:</Text>
                                      <div className="mt-1">
                                        <Tag
                                          color={
                                            q.score >= 80
                                              ? "green"
                                              : q.score >= 60
                                              ? "blue"
                                              : q.score >= 40
                                              ? "orange"
                                              : "red"
                                          }
                                        >
                                          Score: {q.score}%
                                        </Tag>
                                        <div className="bg-gray-50 p-2 mt-1 rounded">
                                          {q.evaluation}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <Empty description="No question data available" />
                            )}
                          </Card>
                        </Card>
                      </div>
                    ) : (
                      <Empty description="Select an interview to view details" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <div>Loading candidate information...</div>
        )}
      </Drawer>
    </div>
  );
};

export default InterviewerPage;
