import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Progress,
  List,
  Divider,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Empty,
  Spin,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
  HomeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  QuestionCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  resetInterview,
  setCurrentStep,
  clearError,
  selectPastInterviews,
  selectLatestInterview,
  selectProfile,
} from "../../store/intervieweeSlice.js";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const InterviewSummary = ({ score, summary, onComplete }) => {
  const dispatch = useDispatch();

  // Get data from Redux
  const { questions, answers, loading, error, status, currentInterviewId } =
    useSelector((s) => s.interviewee);
  const profile = useSelector(selectProfile);
  const pastInterviews = useSelector(selectPastInterviews);
  const latestInterview = useSelector(selectLatestInterview);

  // Local state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (!questions.length || !answers.length) return null;

    const answeredQuestions = answers.filter(
      (answer) => answer.answer && answer.answer.trim() !== "",
    );
    const correctAnswers = answers.filter((answer) => answer.score >= 8);
    const averageTime =
      answers.reduce((acc, answer) => acc + (answer.secondsSpent || 0), 0) /
      answers.length;

    // Group by difficulty
    const difficultyStats = questions.reduce((acc, question, index) => {
      const level = question.level || "medium";
      const answer = answers[index];

      if (!acc[level]) {
        acc[level] = { total: 0, correct: 0, totalScore: 0 };
      }

      acc[level].total++;
      acc[level].totalScore += answer?.score || 0;
      if (answer?.score >= 8) acc[level].correct++;

      return acc;
    }, {});

    return {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      correctAnswers: correctAnswers.length,
      accuracyPercent: Math.round(
        (correctAnswers.length / questions.length) * 100,
      ),
      averageTime: Math.round(averageTime),
      completionRate: Math.round(
        (answeredQuestions.length / questions.length) * 100,
      ),
      difficultyStats,
    };
  };

  const metrics = calculateMetrics();

  // Determine performance level
  const getPerformanceLevel = (score) => {
    if (score >= 90) return { level: "Exceptional", color: "#52c41a" };
    if (score >= 80) return { level: "Excellent", color: "#73d13d" };
    if (score >= 70) return { level: "Good", color: "#faad14" };
    if (score >= 60) return { level: "Fair", color: "#fa8c16" };
    if (score >= 50) return { level: "Needs Improvement", color: "#ff7875" };
    return { level: "Poor", color: "#f5222d" };
  };

  const performance = score ? getPerformanceLevel(score) : null;

  // Generate detailed report
  useEffect(() => {
    if (score && questions.length && answers.length) {
      setIsGeneratingReport(true);
      setTimeout(() => {
        setReportData({
          completedAt: new Date().toISOString(),
          duration: metrics?.averageTime * questions.length || 0,
          interviewId: currentInterviewId || "unknown",
        });
        setIsGeneratingReport(false);
      }, 1000);
    }
  }, [score, questions, answers, metrics, currentInterviewId]);

  // Event handlers
  const handleBackToDashboard = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleStartNewInterview = () => {
    dispatch(resetInterview());
    dispatch(setCurrentStep(0));
    if (onComplete) {
      onComplete();
    }
  };

  const handleDownloadReport = () => {
    // Create a simple text report
    const reportContent = `
Interview Results - ${profile?.name || "Candidate"}
======================================

Date: ${new Date().toLocaleDateString()}
Email: ${profile?.email || "N/A"}

OVERALL SCORE: ${score || 0}%
Performance Level: ${performance?.level || "N/A"}

SUMMARY:
${summary || "No summary available"}

DETAILED RESULTS:
Total Questions: ${questions.length}
Answered: ${metrics?.answeredQuestions || 0}
Correct: ${metrics?.correctAnswers || 0}
Accuracy: ${metrics?.accuracyPercent || 0}%

QUESTION-BY-QUESTION:
${questions
  .map((q, i) => {
    const answer = answers[i] || {};
    return `
Q${i + 1}: ${q.text}
Your Answer: ${answer.answer || "Not answered"}
${q.correctAnswer ? `Correct Answer: ${q.correctAnswer}` : ""}
Score: ${answer.score || 0}/10
${answer.explanation ? `Feedback: ${answer.explanation}` : ""}
Time Spent: ${answer.secondsSpent || 0} seconds
`;
  })
  .join("\n")}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-results-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading || isGeneratingReport) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>
              {loading ? "Calculating your results..." : "Generating report..."}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <Alert
          message="Results Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => dispatch(clearError())}>
              Dismiss
            </Button>
          }
        />
      </Card>
    );
  }

  // No data state
  if (!questions.length || score === null) {
    return (
      <Card>
        <Empty
          description="No interview results available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button type="primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Header */}
        <Card>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <TrophyFilled
                style={{ fontSize: "48px", color: performance?.color }}
              />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Interview Complete!
                </Title>
                <Text type="secondary">
                  Well done{profile?.name ? `, ${profile.name}` : ""}!
                </Text>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Progress
                type="circle"
                percent={score || 0}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                      {percent}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {performance?.level}
                    </div>
                  </div>
                )}
                strokeColor={performance?.color}
                size={140}
                strokeWidth={8}
              />
            </div>

            <Tag
              color={performance?.color}
              style={{ fontSize: "16px", padding: "8px 16px" }}
            >
              <StarFilled /> {performance?.level}
            </Tag>
          </div>
        </Card>

        {/* Summary */}
        <Card title="Performance Summary">
          <Paragraph style={{ fontSize: "16px", lineHeight: "1.6" }}>
            {summary || "Congratulations on completing your interview!"}
          </Paragraph>

          {reportData && (
            <div style={{ marginTop: 16, padding: 16, background: "#f9f9f9" }}>
              <Text type="secondary">
                Interview completed on{" "}
                {new Date(reportData.completedAt).toLocaleDateString()} •
                Duration: {Math.round(reportData.duration / 60)} minutes •
                Interview ID: {reportData.interviewId.slice(-8)}
              </Text>
            </div>
          )}
        </Card>

        {/* Statistics */}
        {metrics && (
          <Card title="Performance Metrics">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Questions"
                  value={metrics.totalQuestions}
                  prefix={<QuestionCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Accuracy"
                  value={metrics.accuracyPercent}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{
                    color:
                      metrics.accuracyPercent >= 70 ? "#3f8600" : "#cf1322",
                  }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Completion Rate"
                  value={metrics.completionRate}
                  suffix="%"
                  prefix={<CheckCircleFilled />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Avg. Time/Question"
                  value={metrics.averageTime}
                  suffix="s"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>

            {/* Difficulty Breakdown */}
            <Divider />
            <Title level={5}>Performance by Difficulty</Title>
            <Row gutter={[16, 16]}>
              {Object.entries(metrics.difficultyStats).map(([level, stats]) => (
                <Col xs={24} sm={8} key={level}>
                  <Card size="small">
                    <Statistic
                      title={
                        <span style={{ textTransform: "capitalize" }}>
                          {level} Questions
                        </span>
                      }
                      value={stats.correct}
                      suffix={`/ ${stats.total}`}
                      valueStyle={{
                        color:
                          stats.correct / stats.total >= 0.7
                            ? "#3f8600"
                            : "#cf1322",
                      }}
                    />
                    <Progress
                      percent={Math.round((stats.correct / stats.total) * 100)}
                      size="small"
                      showInfo={false}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Detailed Results */}
        <Card title="Question-by-Question Results">
          <Collapse>
            {questions.map((question, index) => {
              const answer = answers[index] || {};
              const isCorrect = answer.score >= 8;

              return (
                <Panel
                  header={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {isCorrect ? (
                        <CheckCircleFilled style={{ color: "#52c41a" }} />
                      ) : (
                        <CloseCircleFilled style={{ color: "#f5222d" }} />
                      )}
                      <span>Question {index + 1}</span>
                      <Tag
                        color={
                          question.level === "easy"
                            ? "green"
                            : question.level === "hard"
                              ? "red"
                              : "orange"
                        }
                      >
                        {question.level || "medium"}
                      </Tag>
                      <span style={{ marginLeft: "auto" }}>
                        {answer.score || 0}/10 points
                      </span>
                    </div>
                  }
                  key={index}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>Question:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{question.text}</Text>
                      </div>
                    </div>

                    <div>
                      <Text strong>Your Answer:</Text>
                      <div
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: "#f9f9f9",
                          borderRadius: 6,
                        }}
                      >
                        <Text>{answer.answer || "Not answered"}</Text>
                      </div>
                    </div>

                    {question.correctAnswer && (
                      <div>
                        <Text strong>Correct Answer:</Text>
                        <div
                          style={{
                            marginTop: 8,
                            padding: 12,
                            backgroundColor: "#f6ffed",
                            borderRadius: 6,
                            border: "1px solid #b7eb8f",
                          }}
                        >
                          <Text>{question.correctAnswer}</Text>
                        </div>
                      </div>
                    )}

                    {answer.explanation && (
                      <div>
                        <Text strong>Feedback:</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">{answer.explanation}</Text>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "24px" }}>
                      <Text type="secondary">
                        Time spent: {answer.secondsSpent || 0} seconds
                      </Text>
                      <Text type="secondary">
                        Score: {answer.score || 0}/10
                      </Text>
                    </div>
                  </Space>
                </Panel>
              );
            })}
          </Collapse>
        </Card>

        {/* Actions */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="default"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleStartNewInterview}
            >
              Take Another Interview
            </Button>

            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
          </div>
        </Card>

        {/* Tips for Improvement */}
        {score < 70 && (
          <Card title="Tips for Improvement">
            <Alert
              message="Areas to Focus On"
              description={
                <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                  <li>Review fundamental concepts in your field</li>
                  <li>Practice more technical questions</li>
                  <li>Take time to understand each question fully</li>
                  <li>Consider taking online courses or tutorials</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default InterviewSummary;
