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
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { setSearch, setSort } from "../store/interviewerSlice.js";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
    recentActivity: 0,
  });
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);

  // Calculate dashboard stats
  useEffect(() => {
    if (candidates.length > 0) {
      const completed = candidates.filter((c) => c.status === "Completed");
      const inProgress = candidates.filter((c) => c.status === "In Progress");
      const scores = completed
        .map((c) => c.score)
        .filter((s) => s !== null && s !== undefined);
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      // Count interviews in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentActivity = candidates.filter((c) => {
        const interviewDate = c.interviewDate
          ? new Date(c.interviewDate)
          : null;
        return interviewDate && interviewDate > oneWeekAgo;
      }).length;

      setStats({
        total: candidates.length,
        completed: completed.length,
        inProgress: inProgress.length,
        avgScore: Math.round(avgScore),
        recentActivity,
      });
    }

    // Simulate loading for better UX
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, [candidates]);

  const data = useMemo(() => {
    // Create a flattened array of all attempts with candidate info
    const allAttempts = [];
    candidates.forEach((candidate) => {
      if (candidate.attempts && candidate.attempts.length > 0) {
        candidate.attempts.forEach((attempt, attemptIndex) => {
          // Create a stable unique ID if one doesn't exist
          const stableId =
            attempt.id ||
            `${candidate.id}-attempt-${attemptIndex}-${
              attempt.completedAt || attempt.createdAt || Date.now()
            }`;

          allAttempts.push({
            ...attempt,
            id: stableId, // Ensure we have a stable ID
            candidateId: candidate.id,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            candidatePhone: candidate.phone,
            name: candidate.name, // For backward compatibility
            email: candidate.email, // For backward compatibility
            attemptNumber: attempt.attemptNumber || attemptIndex + 1,
          });
        });
      } else {
        // Backward compatibility for old data structure
        // Ensure we have a stable ID
        const stableId =
          candidate.id ||
          `candidate-${candidate.email || candidate.name || ""}-${
            candidate.interviewDate ||
            candidate.completedAt ||
            candidate.createdAt ||
            Date.now()
          }`;

        allAttempts.push({
          ...candidate,
          id: stableId,
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          attemptNumber: 1,
        });
      }
    });

    // Apply tab filtering
    let filteredByTab = [...allAttempts];
    if (activeTab === "2") {
      // Completed interviews
      filteredByTab = allAttempts.filter((c) => c.status === "Completed");
    } else if (activeTab === "3") {
      // In progress interviews
      filteredByTab = allAttempts.filter((c) => c.status === "In Progress");
    }

    // Apply search filter
    const filteredBySearch = filteredByTab.filter(
      (c) =>
        c.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
        c.candidateEmail?.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    const sorted = [...filteredBySearch].sort((a, b) => {
      const dir = sortOrder === "ascend" ? 1 : -1;

      // Special handling for different sort keys
      if (sortKey === "score") {
        return dir * ((a.score || 0) - (b.score || 0));
      } else if (sortKey === "interviewDate" || sortKey === "completedAt") {
        const dateA = a[sortKey] ? new Date(a[sortKey]) : new Date(0);
        const dateB = b[sortKey] ? new Date(b[sortKey]) : new Date(0);
        return dir * (dateA - dateB);
      } else if (sortKey === "name") {
        return (
          dir *
          String(a.candidateName || "").localeCompare(
            String(b.candidateName || "")
          )
        );
      } else if (sortKey === "email") {
        return (
          dir *
          String(a.candidateEmail || "").localeCompare(
            String(b.candidateEmail || "")
          )
        );
      }

      return (
        dir * String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""))
      );
    });

    return sorted;
  }, [candidates, search, sortKey, sortOrder, activeTab]);

  const getStatusBadge = (status) => {
    if (status === "Completed")
      return <Badge status="success" text="Completed" />;
    if (status === "In Progress")
      return <Badge status="processing" text="In Progress" />;
    return <Badge status="default" text={status || "Pending"} />;
  };

  const getScoreTag = (score) => {
    if (score === null || score === undefined)
      return <Tag color="default">No Score</Tag>;
    if (score >= 80) return <Tag color="green">{score}%</Tag>;
    if (score >= 60) return <Tag color="cyan">{score}%</Tag>;
    if (score >= 40) return <Tag color="orange">{score}%</Tag>;
    return <Tag color="red">{score}%</Tag>;
  };

  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "name",
      sorter: true,
      render: (name, record) => (
        <Space>
          <Avatar className={record.score ? "bg-blue-500" : "bg-orange-500"}>
            {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
          </Avatar>
          <div>
            <div className="font-medium">{name || "Anonymous"}</div>
            <div className="text-xs text-gray-500">
              {record.candidateEmail || record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Attempt",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      width: 100,
      render: (attemptNumber) => (
        <Tag color="blue">Attempt #{attemptNumber || 1}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      sorter: true,
      render: (score) => getScoreTag(score),
    },
    {
      title: "Date",
      dataIndex: "interviewDate",
      key: "interviewDate",
      sorter: true,
      render: (date, record) => {
        const interviewDate = date
          ? new Date(date)
          : record.completedAt
          ? new Date(record.completedAt)
          : record.createdAt
          ? new Date(record.createdAt)
          : new Date();

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
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen ">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="m-0">
            Interviewer Dashboard
          </Title>
        </div>

        {/* Dashboard Stats */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Candidates"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed Interviews"
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
                prefix={<TrophyOutlined />}
                valueStyle={{
                  color: stats.avgScore >= 70 ? "#52c41a" : "#f5222d",
                }}
              />
              {stats.avgScore > 0 && (
                <div className="mt-2.5">
                  <Progress
                    percent={stats.avgScore}
                    size="small"
                    status={stats.avgScore >= 70 ? "success" : "exception"}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
          <TabPane
            tab={
              <span>
                <TeamOutlined /> All Candidates
              </span>
            }
            key="1"
          />
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined /> Completed
              </span>
            }
            key="2"
          />
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined /> In Progress
              </span>
            }
            key="3"
          />
        </Tabs>

        {/* Search and Filters */}
        <div className="flex justify-between items-center mb-4">
          <Input.Search
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="max-w-xs"
            prefix={<SearchOutlined />}
            allowClear
          />
          <Space>
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button icon={<SortAscendingOutlined />}>Sort</Button>
          </Space>
        </div>

        {/* Candidates Table */}
        <Card>
          <Table
            rowKey={(r) => {
              // Create a stable unique key based on multiple properties
              if (r.id) return r.id;

              // Use a combination of properties to create a unique identifier
              const candidateKey = r.candidateId || "";
              const email = r.candidateEmail || r.email || "";
              const attemptNum = r.attemptNumber || "1";
              const timestamp =
                r.interviewDate || r.completedAt || r.createdAt || "";

              // Create a stable composite key
              return `${candidateKey}-${email}-${attemptNum}-${timestamp}`.replace(
                /\s+/g,
                ""
              );
            }}
            columns={columns}
            dataSource={loading ? [] : data}
            loading={loading}
            onChange={(pagination, filters, sorter) => {
              if (sorter?.field)
                dispatch(setSort({ key: sorter.field, order: sorter.order }));
            }}
            onRow={(r) => ({
              onClick: () => setSelected(r),
              style: { cursor: "pointer" },
            })}
            pagination={{
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total) => `Total ${total} candidates`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No candidates found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>

        {/* Candidate Details Drawer */}
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          width={800}
          title={
            <Space align="center">
              <Avatar size={48} className="bg-blue-500">
                {selected?.candidateName || selected?.name ? (
                  (selected?.candidateName || selected?.name)
                    .charAt(0)
                    .toUpperCase()
                ) : (
                  <UserOutlined />
                )}
              </Avatar>
              <div>
                <div className="text-lg font-semibold">
                  {selected?.candidateName || selected?.name || "Candidate"}
                  {selected?.attemptNumber && (
                    <Tag color="blue" className="ml-2">
                      Attempt #{selected.attemptNumber}
                    </Tag>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {selected?.candidateEmail || selected?.email || "No Email"}
                </div>
              </div>
            </Space>
          }
          extra={getScoreTag(selected?.score)}
          footer={
            <div className="text-right">
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button type="primary" className="ml-2">
                Export Report
              </Button>
            </div>
          }
        >
          {selected && (
            <>
              {/* Candidate Overview */}
              <Card title="Interview Attempt Details" className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Descriptions
                      bordered
                      size="small"
                      column={1}
                      layout="vertical"
                    >
                      <Descriptions.Item label="Name">
                        {selected.candidateName ||
                          selected.name ||
                          "Not Provided"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {selected.candidateEmail ||
                          selected.email ||
                          "Not Provided"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        {selected.candidatePhone ||
                          selected.phone ||
                          "Not Provided"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Attempt">
                        {selected.attemptNumber
                          ? `#${selected.attemptNumber}`
                          : "1"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Descriptions
                      bordered
                      size="small"
                      column={1}
                      layout="vertical"
                    >
                      <Descriptions.Item label="Interview Date">
                        {selected.interviewDate
                          ? new Date(selected.interviewDate).toLocaleString()
                          : selected.completedAt
                          ? new Date(selected.completedAt).toLocaleString()
                          : selected.createdAt
                          ? new Date(selected.createdAt).toLocaleString()
                          : "Not Available"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {getStatusBadge(selected.status)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Score">
                        {selected.score !== null &&
                        selected.score !== undefined ? (
                          <Progress
                            type="circle"
                            percent={selected.score}
                            width={40}
                            format={(percent) => `${percent}%`}
                            status={
                              selected.score >= 70
                                ? "success"
                                : selected.score >= 40
                                ? "normal"
                                : "exception"
                            }
                          />
                        ) : (
                          "Not Scored"
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>

              {/* Interview Performance */}
              <Card title="Interview Performance" style={{ marginBottom: 16 }}>
                {selected.summary ? (
                  <Paragraph>{selected.summary}</Paragraph>
                ) : (
                  <Empty
                    description="No summary available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>

              <Tabs defaultActiveKey="1">
                <TabPane
                  tab={
                    <span>
                      <FileTextOutlined /> Resume
                    </span>
                  }
                  key="1"
                >
                  <Card>
                    <Alert
                      message="Resume Content"
                      description="This is the extracted text content from the candidate's resume. Formatting may differ from the original document."
                      type="info"
                      showIcon
                      className="mb-4"
                    />

                    <div className="whitespace-pre-wrap bg-gray-50 p-4 border border-gray-200 rounded min-h-[200px] max-h-[400px] overflow-auto font-mono text-sm leading-normal">
                      {selected.resumeText || "No resume text available."}
                    </div>
                  </Card>
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <InfoCircleOutlined /> Interview Questions
                    </span>
                  }
                  key="2"
                >
                  <Card>
                    {selected.transcript && selected.transcript.length > 0 ? (
                      selected.transcript.map((t, i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: 24,
                            borderBottom:
                              i < selected.transcript.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                            paddingBottom: 16,
                          }}
                        >
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 16 }}>
                              Q{i + 1}: {t.q}
                            </Text>
                          </div>
                          <div
                            style={{
                              background: "#f9f9f9",
                              padding: 12,
                              borderRadius: 4,
                              marginBottom: 8,
                            }}
                          >
                            <Text>{t.a || "No answer provided"}</Text>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Tag
                              color={
                                t.score >= 8
                                  ? "green"
                                  : t.score >= 5
                                  ? "orange"
                                  : "red"
                              }
                            >
                              Score: {t.score !== undefined ? t.score : "N/A"}
                              /10
                            </Tag>
                            <Text type="secondary">
                              {t.explanation || "No feedback available"}
                            </Text>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description="No interview transcript available" />
                    )}
                  </Card>
                </TabPane>
              </Tabs>
            </>
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default InterviewerPage;
