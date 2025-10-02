import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  Input,
  Tag,
  Drawer,
  Descriptions,
  Typography,
  Card,
  Button,
  Space,
  Badge,
  Avatar,
  Tabs,
  Statistic,
  Row,
  Col,
  Tooltip,
  Progress,
  Empty,
  Alert,
  Spin,
  Divider,
  Timeline,
  Rate,
  List,
  Collapse,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  StarOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { setSearch, setSort } from "../store/interviewerSlice.js";
import { LayoutDashboard } from "lucide-react";
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Enhanced Interviewer Dashboard with Production-Grade Detail Drawer
 */
const InterviewerPage = () => {
  const dispatch = useDispatch();
  const { candidates, search, sortKey, sortOrder } = useSelector(
    (s) => s.interviewer
  );

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  // Removed page-specific loading state in favor of global loading

  // Simple data processing
  const processedData = useMemo(() => {
    let allAttempts = [];

    candidates.forEach((candidate) => {
      if (!candidate.email) return;

      const attempts =
        candidate.attempts?.length > 0
          ? candidate.attempts
          : [{ ...candidate, attemptNumber: 1 }];

      attempts.forEach((attempt, index) => {
        allAttempts.push({
          key: attempt.id || `${candidate.email}-${index}`,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          ...attempt,
          attemptNumber: attempt.attemptNumber || index + 1,
        });
      });
    });

    // Apply tab filtering
    let filteredData = allAttempts;
    if (activeTab === "2") {
      filteredData = allAttempts.filter((item) => item.status === "Completed");
    } else if (activeTab === "3") {
      filteredData = allAttempts.filter(
        (item) => item.status === "In Progress"
      );
    }

    // Apply search filtering
    if (search) {
      filteredData = filteredData.filter(
        (item) =>
          item.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
          item.candidateEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    if (sortKey && sortOrder) {
      filteredData.sort((a, b) => {
        const direction = sortOrder === "ascend" ? 1 : -1;
        let valueA = a[sortKey] || "";
        let valueB = b[sortKey] || "";

        if (sortKey === "score") {
          valueA = a.score ?? -1;
          valueB = b.score ?? -1;
        } else if (sortKey === "interviewDate") {
          valueA = new Date(a.interviewDate || a.createdAt || 0);
          valueB = new Date(b.interviewDate || b.createdAt || 0);
        } else if (typeof valueA === "string") {
          return direction * valueA.localeCompare(valueB);
        }

        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
      });
    }

    return filteredData;
  }, [candidates, search, sortKey, sortOrder, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const allAttempts = [];
    candidates.forEach((candidate) => {
      const attempts =
        candidate.attempts?.length > 0 ? candidate.attempts : [candidate];
      allAttempts.push(...attempts);
    });

    const completed = allAttempts.filter((item) => item.status === "Completed");
    const inProgress = allAttempts.filter(
      (item) => item.status === "In Progress"
    );
    const scoresArray = completed
      .filter((item) => item.score != null)
      .map((item) => item.score);
    const avgScore =
      scoresArray.length > 0
        ? Math.round(
            scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length
          )
        : 0;

    return {
      total: allAttempts.length,
      completed: completed.length,
      inProgress: inProgress.length,
      avgScore,
    };
  }, [candidates]);

  // Calculate detailed analytics for selected candidate
  const candidateAnalytics = useMemo(() => {
    if (!selectedCandidate) return null;

    const transcript = selectedCandidate.transcript || [];
    const answers = selectedCandidate.answers || [];
    const questions = selectedCandidate.questions || [];

    // For in-progress interviews, use current question data
    const totalQuestions = questions.length || transcript.length || 10; // fallback to 10
    const answeredQuestions = transcript.length || answers.length || 0;
    const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);

    // Calculate score analytics
    const scoredAnswers = transcript.filter((item) => item.score != null);
    const correctAnswers = scoredAnswers.filter(
      (item) => item.score >= 7
    ).length;
    const incorrectAnswers = scoredAnswers.filter(
      (item) => item.score < 7
    ).length;
    const partialAnswers = scoredAnswers.filter(
      (item) => item.score >= 4 && item.score < 7
    ).length;

    // Calculate completion percentage
    const completionPercentage =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    // Calculate average time per question (if available)
    const timings = answers.map((a) => a.secondsSpent).filter((t) => t != null);
    const avgTimePerQuestion =
      timings.length > 0
        ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
        : null;

    // Calculate total time spent
    const totalTimeSpent =
      timings.length > 0 ? timings.reduce((a, b) => a + b, 0) : null;

    // Performance rating
    const score = selectedCandidate.score;
    let performanceRating = 0;
    if (score >= 90) performanceRating = 5;
    else if (score >= 80) performanceRating = 4;
    else if (score >= 70) performanceRating = 3;
    else if (score >= 60) performanceRating = 2;
    else if (score >= 40) performanceRating = 1;

    return {
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      correctAnswers,
      incorrectAnswers,
      partialAnswers,
      completionPercentage,
      avgTimePerQuestion,
      totalTimeSpent,
      performanceRating,
      isInProgress: selectedCandidate.status === "In Progress",
      isCompleted: selectedCandidate.status === "Completed",
    };
  }, [selectedCandidate]);

  // Removed loading timer in favor of global loading system

  // Helper functions
  const getStatusBadge = (status) => {
    if (status === "Completed")
      return <Badge status="success" text="Completed" />;
    if (status === "In Progress")
      return <Badge status="processing" text="In Progress" />;
    return <Badge status="default" text={status || "Pending"} />;
  };

  const getScoreTag = (score) => {
    if (score == null) return <Tag color="default">No Score</Tag>;
    if (score >= 80) return <Tag color="green">{score}%</Tag>;
    if (score >= 60) return <Tag color="cyan">{score}%</Tag>;
    if (score >= 40) return <Tag color="orange">{score}%</Tag>;
    return <Tag color="red">{score}%</Tag>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Table columns
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
      title: "Role & Config",
      key: "configuration",
      render: (_, record) => (
        <div>
          <Tag color="blue" className="mb-1">
            {record.role || record.additionalData?.role || "Full-stack"}
          </Tag>
          <br />
          <div className="text-xs text-gray-500">
            {record.duration || record.additionalData?.duration || "10"}min •
            {record.complexity ||
              record.additionalData?.complexity ||
              "balanced"}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusBadge(status),
      filters: [
        { text: "Completed", value: "Completed" },
        { text: "In Progress", value: "In Progress" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Score & Progress",
      key: "scoreProgress",
      sorter: true,
      render: (_, record) => (
        <div>
          {getScoreTag(record.score)}
          <div className="text-xs text-gray-500 mt-1">
            {record.answeredQuestions || 0}/{record.totalQuestions || 0}{" "}
            answered
          </div>
        </div>
      ),
    },
    {
      title: "Time & Attempt",
      key: "timeAttempt",
      render: (_, record) => (
        <div>
          <div className="text-sm">Attempt #{record.attemptNumber || 1}</div>
          <div className="text-xs text-gray-500">
            {record.totalTimeSpent
              ? `${Math.floor(record.totalTimeSpent / 60)}m ${
                  record.totalTimeSpent % 60
                }s`
              : "Time not tracked"}
          </div>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "interviewDate",
      key: "interviewDate",
      sorter: true,
      render: (date, record) => (
        <div>
          <div className="text-sm">{formatDate(date || record.createdAt)}</div>
          {record.completedAt && (
            <div className="text-xs text-gray-500">
              Completed: {formatDate(record.completedAt)}
            </div>
          )}
        </div>
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
            setSelectedCandidate(record);
            setDrawerVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  // Removed page-specific loading check in favor of global loading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <LayoutDashboard className="text-white" size={24} />
                </div>
                <div>
                  <Title level={2} className="!mb-0 !text-2xl !font-bold">
                    Interview Dashboard
                  </Title>
                  <Text className="text-gray-500 text-sm">
                    Track candidate interviews and review their performance
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Interviews"
                value={stats.total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={stats.avgScore || "N/A"}
                suffix="%"
                prefix={<TrophyOutlined />}
              />
              {stats.avgScore > 0 && (
                <Progress
                  percent={stats.avgScore}
                  size="small"
                  status={stats.avgScore >= 70 ? "success" : "exception"}
                  showInfo={false}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mb-4"
          items={[
            {
              key: "1",
              label: (
                <span>
                  <TeamOutlined /> All Interviews
                </span>
              ),
            },
            {
              key: "2",
              label: (
                <span>
                  <CheckCircleOutlined /> Completed
                </span>
              ),
            },
            {
              key: "3",
              label: (
                <span>
                  <ClockCircleOutlined /> In Progress
                </span>
              ),
            },
          ]}
        />

        {/* Search */}
        <div className="flex justify-between items-center mb-4">
          <Input.Search
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="max-w-xs"
            allowClear
          />
          <Text type="secondary">
            Showing {processedData.length} interview
            {processedData.length !== 1 ? "s" : ""}
          </Text>
        </div>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={processedData}
            pagination={{
              total: processedData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} interviews`,
            }}
            onChange={(pagination, filters, sorter) => {
              if (sorter) {
                dispatch(
                  setSort({
                    key: sorter.field,
                    order: sorter.order,
                  })
                );
              }
            }}
          />
        </Card>
      </div>

      {/* ENHANCED Production-Grade Details Drawer - Half Screen */}
      <Drawer
        title={null}
        placement="right"
        width="65vw" // 50vw Half screen width
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        styles={{
          body: { padding: 0 },
        }}
      >
        {selectedCandidate && candidateAnalytics && (
          <div className="h-full flex flex-col">
            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg ">
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
                  <div className="text-right">
                    {getStatusBadge(selectedCandidate.status)}
                    <div className="mt-2">
                      {candidateAnalytics.isCompleted && (
                        <Rate
                          disabled
                          value={candidateAnalytics.performanceRating}
                          className="text-yellow-300"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Quick Stats Row */}
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="Questions Answered"
                      value={candidateAnalytics.answeredQuestions}
                      suffix={`/ ${candidateAnalytics.totalQuestions}`}
                      prefix={
                        <CheckCircleOutlined className="text-green-500" />
                      }
                      valueStyle={{ color: "#52c41a", fontSize: "18px" }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="Completion"
                      value={candidateAnalytics.completionPercentage}
                      suffix="%"
                      prefix={<BarChartOutlined className="text-blue-500" />}
                      valueStyle={{ color: "#1890ff", fontSize: "18px" }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title={
                        candidateAnalytics.isCompleted
                          ? "Final Score"
                          : "Current Progress"
                      }
                      value={
                        candidateAnalytics.isCompleted
                          ? selectedCandidate.score
                          : candidateAnalytics.answeredQuestions
                      }
                      suffix={
                        candidateAnalytics.isCompleted ? "%" : " answered"
                      }
                      prefix={<TrophyOutlined className="text-orange-500" />}
                      valueStyle={{
                        color: candidateAnalytics.isCompleted
                          ? selectedCandidate.score >= 70
                            ? "#52c41a"
                            : "#faad14"
                          : "#722ed1",
                        fontSize: "18px",
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Progress Bar */}
              <Card title="Interview Progress" size="small">
                <Progress
                  percent={candidateAnalytics.completionPercentage}
                  status={candidateAnalytics.isCompleted ? "success" : "active"}
                  strokeColor={
                    candidateAnalytics.isCompleted ? "#52c41a" : "#1890ff"
                  }
                />
                <div className="mt-2 text-sm text-gray-600">
                  {candidateAnalytics.isInProgress && (
                    <Text type="secondary">
                      <PlayCircleOutlined className="mr-1" />
                      Interview in progress -{" "}
                      {candidateAnalytics.unansweredQuestions} questions
                      remaining
                    </Text>
                  )}
                  {candidateAnalytics.isCompleted && (
                    <Text type="success">
                      <CheckCircleOutlined className="mr-1" />
                      Interview completed on{" "}
                      {formatDate(
                        selectedCandidate.completedAt ||
                          selectedCandidate.interviewDate
                      )}
                    </Text>
                  )}
                </div>
              </Card>

              {/* Performance Breakdown (for completed interviews) */}
              {candidateAnalytics.isCompleted &&
                candidateAnalytics.correctAnswers > 0 && (
                  <Card title="Performance Breakdown" size="small">
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {candidateAnalytics.correctAnswers}
                          </div>
                          <div className="text-sm text-gray-600">
                            <CheckOutlined className="mr-1" />
                            Correct
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-500">
                            {candidateAnalytics.partialAnswers}
                          </div>
                          <div className="text-sm text-gray-600">
                            <MinusOutlined className="mr-1" />
                            Partial
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">
                            {candidateAnalytics.incorrectAnswers}
                          </div>
                          <div className="text-sm text-gray-600">
                            <CloseOutlined className="mr-1" />
                            Incorrect
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

              {/* Interview Configuration Details */}
              <Card title="Interview Configuration" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Job Role">
                        <Tag color="blue">
                          {selectedCandidate.role ||
                            selectedCandidate.additionalData?.role ||
                            "Full-stack Engineer"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Duration">
                        <Tag color="green">
                          {selectedCandidate.duration ||
                            selectedCandidate.additionalData?.duration ||
                            10}{" "}
                          minutes
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Complexity">
                        <Tag color="orange">
                          {selectedCandidate.complexity ||
                            selectedCandidate.additionalData?.complexity ||
                            "balanced"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Focus Area">
                        <Tag color="purple">
                          {selectedCandidate.focusArea ||
                            selectedCandidate.additionalData?.focusArea ||
                            "full-coverage"}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Questions Generated">
                        {selectedCandidate.totalQuestions ||
                          candidateAnalytics.totalQuestions ||
                          "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Time Spent">
                        {candidateAnalytics.totalTimeSpent
                          ? `${Math.floor(
                              candidateAnalytics.totalTimeSpent / 60
                            )}m ${candidateAnalytics.totalTimeSpent % 60}s`
                          : "Not tracked"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Average per Question">
                        {candidateAnalytics.avgTimePerQuestion
                          ? `${candidateAnalytics.avgTimePerQuestion}s`
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Completion Ratio">
                        <Progress
                          percent={candidateAnalytics.completionPercentage}
                          size="small"
                          status={
                            candidateAnalytics.isCompleted
                              ? "success"
                              : "active"
                          }
                        />
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>

              {/* Performance Analytics (Enhanced) */}
              {candidateAnalytics.isCompleted && (
                <Card title="Detailed Performance Analytics" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card
                        size="small"
                        className="text-center border-green-200"
                      >
                        <Statistic
                          title="Accuracy Rate"
                          value={
                            candidateAnalytics.correctAnswers &&
                            candidateAnalytics.totalQuestions
                              ? Math.round(
                                  (candidateAnalytics.correctAnswers /
                                    candidateAnalytics.totalQuestions) *
                                    100
                                )
                              : 0
                          }
                          suffix="%"
                          valueStyle={{ color: "#52c41a" }}
                          prefix={<CheckCircleOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        size="small"
                        className="text-center border-blue-200"
                      >
                        <Statistic
                          title="Time Efficiency"
                          value={selectedCandidate.timeEfficiency || 85}
                          suffix="%"
                          valueStyle={{ color: "#1890ff" }}
                          prefix={<ClockCircleOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        size="small"
                        className="text-center border-purple-200"
                      >
                        <Statistic
                          title="Overall Rating"
                          value={candidateAnalytics.performanceRating || 4}
                          suffix="/5"
                          valueStyle={{ color: "#722ed1" }}
                          prefix={<StarOutlined />}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* Difficulty Breakdown */}
                  {selectedCandidate.difficultyBreakdown && (
                    <div className="mt-4">
                      <Title level={5}>Performance by Difficulty</Title>
                      <Row gutter={[8, 8]}>
                        {["easy", "medium", "hard"].map((level) => {
                          const breakdown =
                            selectedCandidate.difficultyBreakdown[level];
                          if (!breakdown) return null;

                          return (
                            <Col span={8} key={level}>
                              <div
                                className={`p-3 rounded border ${
                                  level === "easy"
                                    ? "border-green-200 bg-green-50"
                                    : level === "medium"
                                    ? "border-yellow-200 bg-yellow-50"
                                    : "border-red-200 bg-red-50"
                                }`}
                              >
                                <div className="text-sm font-medium capitalize">
                                  {level}
                                </div>
                                <div className="text-lg font-bold">
                                  {breakdown.correct}/{breakdown.total}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Avg:{" "}
                                  {Math.round(
                                    (breakdown.totalScore / breakdown.total) *
                                      10
                                  ) / 10}
                                  /10
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </Card>
              )}

              {/* Interview Details */}
              <Card title="Interview Details" size="small">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Attempt Number">
                    #{selectedCandidate.attemptNumber || 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="Started">
                    {formatDate(
                      selectedCandidate.createdAt ||
                        selectedCandidate.interviewDate
                    )}
                  </Descriptions.Item>
                  {candidateAnalytics.isCompleted && (
                    <Descriptions.Item label="Completed">
                      {formatDate(selectedCandidate.completedAt)}
                    </Descriptions.Item>
                  )}
                  {candidateAnalytics.avgTimePerQuestion && (
                    <Descriptions.Item label="Avg. Time/Question">
                      {formatDuration(candidateAnalytics.avgTimePerQuestion)}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Interview Type">
                    <Tag color="blue">MCQ Assessment</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Questions">
                    {candidateAnalytics.totalQuestions}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              {/* Interview Summary */}
              {selectedCandidate.summary && (
                <Card title="AI Summary" size="small">
                  <Paragraph>{selectedCandidate.summary}</Paragraph>
                </Card>
              )}

              {/* Question by Question Breakdown */}
              {selectedCandidate.transcript &&
                selectedCandidate.transcript.length > 0 && (
                  <Card title="Question by Question Analysis" size="small">
                    <List
                      itemLayout="vertical"
                      dataSource={selectedCandidate.transcript}
                      renderItem={(item, index) => (
                        <List.Item
                          key={index}
                          extra={
                            item.score != null ? (
                              <Tag
                                color={
                                  item.score >= 8
                                    ? "green"
                                    : item.score >= 6
                                    ? "orange"
                                    : "red"
                                }
                                className="ml-2"
                              >
                                {item.score}/10
                              </Tag>
                            ) : (
                              <Tag color="default">Pending</Tag>
                            )
                          }
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar size="small" className="bg-blue-500">
                                Q{index + 1}
                              </Avatar>
                            }
                            title={
                              <Text strong className="text-sm">
                                {item.q}
                              </Text>
                            }
                            description={
                              <div className="space-y-2">
                                <div>
                                  <Text className="text-xs text-gray-600">
                                    Answer:
                                  </Text>
                                  <div className="text-sm">
                                    {item.a || "No answer provided"}
                                  </div>
                                </div>
                                {item.explanation && (
                                  <div>
                                    <Text className="text-xs text-gray-600">
                                      Feedback:
                                    </Text>
                                    <div className="text-sm text-gray-700">
                                      {item.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

              {/* In-Progress Status */}
              {candidateAnalytics.isInProgress && (
                <Alert
                  message="Interview In Progress"
                  description={`The candidate is currently answering question ${
                    candidateAnalytics.answeredQuestions + 1
                  } of ${
                    candidateAnalytics.totalQuestions
                  }. Real-time updates will appear here.`}
                  type="info"
                  showIcon
                  icon={<ClockCircleOutlined />}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default InterviewerPage;
