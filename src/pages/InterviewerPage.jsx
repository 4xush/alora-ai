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
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { setSearch, setSort } from "../store/interviewerSlice.js"; // Adjust path if necessary

const { Title, Text, Paragraph } = Typography;

// Helper function to get a consistent date from a record
const getRecordDate = (record) => {
  const date = record.interviewDate || record.completedAt || record.createdAt;
  return date ? new Date(date) : null;
};

const InterviewerPage = () => {
  const dispatch = useDispatch();
  const { candidates, search, sortKey, sortOrder } = useSelector(
    (s) => s.interviewer
  );
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    avgScore: 0,
  });
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);

  // Memoize dashboard stats for performance
  const dashboardStats = useMemo(() => {
    if (!candidates || candidates.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, avgScore: 0 };
    }

    let completedCount = 0;
    let inProgressCount = 0;
    const scores = [];

    candidates.forEach((c) => {
      const attempts = c.attempts && c.attempts.length > 0 ? c.attempts : [c];
      attempts.forEach((attempt) => {
        if (attempt.status === "Completed") {
          completedCount++;
          if (attempt.score != null) {
            scores.push(attempt.score);
          }
        } else if (attempt.status === "In Progress") {
          inProgressCount++;
        }
      });
    });

    const avgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      total: candidates.length, // Total unique candidates
      completed: completedCount,
      inProgress: inProgressCount,
      avgScore: Math.round(avgScore),
    };
  }, [candidates]);

  useEffect(() => {
    setStats(dashboardStats);
    // Simulate loading for better UX
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [dashboardStats]);

  // **[REFACTORED]** Centralized data processing logic
  const processedData = useMemo(() => {
    // 1. Flatten all attempts from all candidates into a single array
    const allAttempts = candidates.flatMap((candidate) => {
      // Handle both new data structure (with attempts) and old structure
      const attemptsSource =
        candidate.attempts && candidate.attempts.length > 0
          ? candidate.attempts
          : [{ ...candidate, attemptNumber: 1 }]; // Treat old data as a single attempt

      return attemptsSource.map((attempt, index) => {
        // 2. Create a GUARANTEED unique and stable key for each attempt
        const uniqueKey =
          attempt.id ||
          `${candidate.id || candidate.email}-attempt-${
            attempt.attemptNumber || index + 1
          }`;

        // 3. Return a clean, consolidated object for the table row
        return {
          ...candidate, // Base candidate info
          ...attempt, // Overwrite with specific attempt info
          key: uniqueKey, // The unique key for the React component
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          // Ensure attemptNumber is consistent
          attemptNumber: attempt.attemptNumber || index + 1,
        };
      });
    });

    // 4. Deduplicate using the unique key (handles any lingering data issues)
    const uniqueAttempts = Array.from(
      new Map(allAttempts.map((item) => [item.key, item])).values()
    );

    // 5. Apply filtering and sorting
    let filteredData = uniqueAttempts;

    if (activeTab === "2") {
      filteredData = uniqueAttempts.filter((c) => c.status === "Completed");
    } else if (activeTab === "3") {
      filteredData = uniqueAttempts.filter((c) => c.status === "In Progress");
    }

    if (search) {
      filteredData = filteredData.filter(
        (c) =>
          c.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
          c.candidateEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sortKey && sortOrder) {
      filteredData.sort((a, b) => {
        const dir = sortOrder === "ascend" ? 1 : -1;
        let valA, valB;

        if (sortKey === "score") {
          valA = a.score ?? -1; // Treat null scores as lowest
          valB = b.score ?? -1;
        } else if (sortKey === "interviewDate") {
          valA = getRecordDate(a);
          valB = getRecordDate(b);
        } else if (
          sortKey === "candidateName" ||
          sortKey === "candidateEmail"
        ) {
          valA = a[sortKey] || "";
          valB = b[sortKey] || "";
          return dir * valA.localeCompare(valB);
        } else {
          valA = a[sortKey] || "";
          valB = b[sortKey] || "";
        }

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    return filteredData;
  }, [candidates, search, sortKey, sortOrder, activeTab]);

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

  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "candidateName",
      sorter: true,
      render: (_, record) => (
        <Space>
          <Avatar className={record.score ? "bg-blue-500" : "bg-gray-400"}>
            {record.candidateName ? (
              record.candidateName.charAt(0).toUpperCase()
            ) : (
              <UserOutlined />
            )}
          </Avatar>
          <div>
            <div className="font-medium">
              {record.candidateName || "Anonymous"}
            </div>
            <div className="text-xs text-gray-500">{record.candidateEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Attempt",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      width: 100,
      render: (num) => <Tag color="blue">Attempt #{num || 1}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: getStatusBadge,
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      sorter: true,
      render: getScoreTag,
    },
    {
      title: "Date",
      dataIndex: "interviewDate",
      key: "interviewDate",
      sorter: true,
      render: (_, record) => {
        const interviewDate = getRecordDate(record);
        if (!interviewDate) return "N/A";
        return (
          <Tooltip title={interviewDate.toLocaleString()}>
            <Space>
              <CalendarOutlined />
              {interviewDate.toLocaleDateString()}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(record);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
        <Title level={2} className="!m-0 !mb-6">
          Interviewer Dashboard
        </Title>

        {/* Dashboard Stats */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="Total Candidates"
                value={stats.total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
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

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mb-4"
          items={[
            {
              key: "1",
              label: (
                <span>
                  <TeamOutlined /> All Attempts
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

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <Input.Search
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="w-full sm:max-w-xs"
            allowClear
          />
        </div>

        {/* Candidates Table */}
        <Card variant="borderless">
          <Table
            // **[SIMPLIFIED]** Use the guaranteed unique key from our processed data
            rowKey="key"
            columns={columns}
            dataSource={processedData}
            loading={loading}
            onChange={(pagination, filters, sorter) => {
              dispatch(setSort({ key: sorter.field, order: sorter.order }));
            }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              showSizeChanger: true,
              pageSize: 10,
              showTotal: (total) => `Total ${total} items`,
            }}
            locale={{ emptyText: <Empty description="No candidates found" /> }}
          />
        </Card>

        {/* Candidate Details Drawer (No changes needed here, but included for completeness) */}
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          width={window.innerWidth > 800 ? 800 : "90%"}
          title="Candidate Attempt Details"
        >
          {selected && (
            <Space direction="vertical" size="large" className="w-full">
              <Descriptions bordered column={1} title="Profile">
                <Descriptions.Item label="Name">
                  {selected.candidateName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selected.candidateEmail}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selected.candidatePhone || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions bordered column={1} title="Interview Details">
                <Descriptions.Item label="Attempt">{`#${selected.attemptNumber}`}</Descriptions.Item>
                <Descriptions.Item label="Date">
                  {getRecordDate(selected)?.toLocaleString() || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusBadge(selected.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Score">
                  {getScoreTag(selected.score)}
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title="AI Summary">
                {selected.summary ? (
                  <Paragraph>{selected.summary}</Paragraph>
                ) : (
                  <Empty description="No summary available" />
                )}
              </Card>

              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: "1",
                    label: (
                      <span>
                        <FileTextOutlined /> Resume
                      </span>
                    ),
                    children: (
                      <>
                        <Alert
                          message="Extracted resume text"
                          type="info"
                          showIcon
                          className="mb-4"
                        />
                        <div className="whitespace-pre-wrap bg-gray-50 p-4 border rounded max-h-96 overflow-auto text-xs">
                          {selected.resumeText || "No resume text available."}
                        </div>
                      </>
                    ),
                  },
                  {
                    key: "2",
                    label: (
                      <span>
                        <InfoCircleOutlined /> Q&A Transcript
                      </span>
                    ),
                    children: (
                      <>
                        {selected.transcript &&
                        selected.transcript.length > 0 ? (
                          selected.transcript.map((t, i) => (
                            <div
                              key={i}
                              className="mb-4 pb-4 border-b last:border-b-0"
                            >
                              <Text strong>
                                Q{i + 1}: {t.q}
                              </Text>
                              <div className="bg-gray-50 p-2 rounded mt-2">
                                <Text>{t.a || "No answer provided"}</Text>
                              </div>
                            </div>
                          ))
                        ) : (
                          <Empty description="No transcript available" />
                        )}
                      </>
                    ),
                  },
                ]}
              />
            </Space>
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default InterviewerPage;
