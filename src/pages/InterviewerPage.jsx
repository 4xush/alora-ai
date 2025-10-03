import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Typography,
  Button,
  Badge,
  Tag,
  Avatar,
  Card,
  Statistic,
  Space,
  Row,
  Col,
  Input,
  Empty,
  Spin,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { LayoutDashboard } from "lucide-react";
import { clearAllCandidates } from "../store/interviewerSlice";

const { Title, Text } = Typography;

/**
 * Enhanced Interviewer Dashboard
 * Candidate-centric implementation with clean UI
 */
const InterviewerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { candidates, search, sortKey, sortOrder } = useSelector(
    (s) => s.interviewer
  );

  // Handler for viewing candidate details
  const handleViewCandidate = (candidateEmail) => {
    // Navigate to existing dashboard but filtered for this candidate
    navigate(`/interviewer/candidate/${encodeURIComponent(candidateEmail)}`);
  };

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
    if (score === null || score === undefined)
      return <Tag color="default">No Score</Tag>;

    if (score >= 80)
      return (
        <Tag color="success" className="font-medium">
          {score}%
        </Tag>
      );
    if (score >= 60)
      return (
        <Tag color="blue" className="font-medium">
          {score}%
        </Tag>
      );
    if (score >= 40)
      return (
        <Tag color="warning" className="font-medium">
          {score}%
        </Tag>
      );
    return (
      <Tag color="error" className="font-medium">
        {score}%
      </Tag>
    );
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

  // Updated columns to be candidate-centric
  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "candidateName",
      sorter: true,
      render: (text, record) => (
        <div className="flex items-center">
          <Avatar
            size="default"
            className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md mr-3"
          >
            {text?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{text}</div>
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
          <div className="text-sm font-medium text-gray-900">
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
        <div className="text-sm text-gray-600">
          {formatDate(record.latestDate)}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => handleViewCandidate(record.candidateEmail)}
          className="border-blue-400 text-blue-600 hover:bg-blue-50"
        >
          View Profile
        </Button>
      ),
    },
  ];
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
                    Interviewer Dashboard
                  </Title>
                  <Text className="text-gray-500 text-sm">
                    Manage candidates and review their interview performance
                  </Text>
                </div>
              </div>
            </div>
            <div>
              <Input.Search
                placeholder="Search candidates..."
                style={{ width: 300 }}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-2 py-4">
        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Total Candidates"
                value={stats.totalCandidates}
                prefix={<UserOutlined className="text-blue-500" />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Total Interviews"
                value={stats.totalInterviews}
                prefix={<TeamOutlined className="text-green-500" />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Completed Interviews"
                value={stats.completedInterviews}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-sm">
              <Statistic
                title="Average Score"
                value={stats.averageScore || "N/A"}
                suffix="%"
                prefix={<TrophyOutlined className="text-yellow-500" />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Candidates Table */}
        <Card className="border-0 shadow-sm">
          <div className="mb-4">
            <Title level={4} className="!mb-2">
              All Candidates
            </Title>
            <Text type="secondary">
              View and manage candidate interview records
            </Text>
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
              className: "!mt-4",
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No candidates found"
                />
              ),
            }}
            className="border-0"
          />
        </Card>
      </div>
    </div>
  );
};

export default InterviewerPage;
