import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Progress,
  List,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Collapse,
  Empty,
  Spin,
  message,
  Tabs,
  Timeline,
  Table,
  Tooltip,
  Badge,
  Divider,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
  HomeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  BookOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Title, Text, Paragraph } = Typography;
// Use Collapse.items instead of deprecated Collapse.Panel children

/**
 * SummaryPage shows the interview results and provides feedback
 */
const SummaryPage = () => {
  const navigate = useNavigate();
  const settings = useSelector((state) => state.settings);

  const {
    profile,
    questions,
    answers,
    finalScore,
    finalSummary,
    loading,
    error,
    handleBackToDashboard,
    handleRetakeInterview,
  } = useInterviewFlow();

  // Local state
  const [activeTab, setActiveTab] = useState("overview");

  // Effect to block any attempts to go back to interview screen
  useEffect(() => {
    // Update history to prevent going back to interview
    // This is a double-protection mechanism in case other redirects fail
    window.history.pushState(null, "", window.location.href);

    // When user clicks back, push them forward again
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Safe navigation functions with fallback
  const safeNavigateToDashboard = () => {
    console.log("Navigating to dashboard");
    try {
      if (handleBackToDashboard) {
        handleBackToDashboard();
      } else {
        console.warn("handleBackToDashboard is undefined, using fallback");
        // Use replace: true to avoid back-button issues
        navigate("/interviewee/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Navigation error:", err);
      message.error("Navigation error, redirecting...");
      // Ultimate fallback
      window.location.replace("/interviewee/dashboard");
    }
  };

  const safeRetakeInterview = () => {
    console.log("Starting new interview");
    try {
      if (handleRetakeInterview) {
        handleRetakeInterview();
      } else {
        console.warn("handleRetakeInterview is undefined, using fallback");
        // Use replace: true to avoid back-button issues
        navigate("/interviewee/pre-interview", { replace: true });
      }
    } catch (err) {
      console.error("Navigation error:", err);
      message.error("Navigation error, redirecting...");
      // Ultimate fallback
      window.location.replace("/interviewee/pre-interview");
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    console.log("Calculating metrics with", { questions, answers });

    // Log more details about the data to help debug
    console.log(
      "Questions array:",
      Array.isArray(questions) ? questions.length : "not an array"
    );
    console.log(
      "Answers array:",
      Array.isArray(answers) ? answers.length : "not an array"
    );

    // Safely handle null or empty arrays
    if (
      !Array.isArray(questions) ||
      !questions.length ||
      !Array.isArray(answers) ||
      !answers.length
    ) {
      console.warn(
        "Cannot calculate metrics: missing questions or answers data"
      );
      return null;
    }

    const answeredQuestions = answers.filter(
      (answer) =>
        answer &&
        answer.answer !== undefined &&
        (typeof answer.answer === "string" || typeof answer.answer === "number")
    );
    const correctAnswers = answers.filter(
      (answer) => answer && answer.score >= 8
    );

    // Enhanced time analysis
    const totalTimeSpent = answers.reduce(
      (acc, answer) => acc + (answer?.secondsSpent || 0),
      0
    );
    const averageTime = totalTimeSpent / (answers.length || 1);

    // Calculate time efficiency (time spent vs time allocated)
    const timeEfficiency = questions.map((question, index) => {
      const answer = answers[index];
      const timeSpent = answer?.secondsSpent || 0;
      const timeAllocated = question?.seconds || 60;
      return {
        questionId: question.id || index,
        timeSpent,
        timeAllocated,
        efficiency: timeAllocated > 0 ? (timeSpent / timeAllocated) * 100 : 0,
        wasTimeUp: answer?.wasTimeUp || false,
        wasSkipped: answer?.wasSkipped || false,
      };
    });

    // Group by difficulty with enhanced stats
    const difficultyStats = questions.reduce((acc, question, index) => {
      const level = question?.level || "medium";
      const answer = answers[index];

      if (!acc[level]) {
        acc[level] = {
          total: 0,
          correct: 0,
          totalScore: 0,
          totalTime: 0,
          timeOuts: 0,
          skipped: 0,
        };
      }

      acc[level].total++;
      acc[level].totalScore += answer?.score || 0;
      acc[level].totalTime += answer?.secondsSpent || 0;

      if (answer?.score >= 8) acc[level].correct++;
      if (answer?.wasTimeUp) acc[level].timeOuts++;
      if (answer?.wasSkipped) acc[level].skipped++;

      return acc;
    }, {});

    // Calculate strengths and weaknesses
    const performanceByTopic = {};
    questions.forEach((question, index) => {
      const topic =
        question?.metadata?.focusArea || question?.topic || "General";
      const answer = answers[index];
      const score = answer?.score || 0;

      if (!performanceByTopic[topic]) {
        performanceByTopic[topic] = { scores: [], total: 0, count: 0 };
      }

      performanceByTopic[topic].scores.push(score);
      performanceByTopic[topic].total += score;
      performanceByTopic[topic].count++;
    });

    // Identify strengths (topics with avg score >= 8) and weaknesses (< 6)
    const strengths = [];
    const weaknesses = [];

    Object.entries(performanceByTopic).forEach(([topic, data]) => {
      const avgScore = data.total / data.count;
      if (avgScore >= 8) {
        strengths.push({
          topic,
          avgScore: Math.round(avgScore * 10) / 10,
          count: data.count,
        });
      } else if (avgScore < 6) {
        weaknesses.push({
          topic,
          avgScore: Math.round(avgScore * 10) / 10,
          count: data.count,
        });
      }
    });

    return {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      correctAnswers: correctAnswers.length,
      accuracyPercent: Math.round(
        (correctAnswers.length / (questions.length || 1)) * 100
      ),
      averageTime: Math.round(averageTime),
      totalTimeSpent,
      completionRate: Math.round(
        (answeredQuestions.length / (questions.length || 1)) * 100
      ),
      difficultyStats,
      timeEfficiency,
      performanceByTopic,
      strengths,
      weaknesses,
      skippedQuestions: answers.filter((a) => a?.wasSkipped).length,
      timedOutQuestions: answers.filter((a) => a?.wasTimeUp).length,
    };
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  const metrics = calculateMetrics();

  // Loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <Spin size="large" />
        <div className="mt-4">
          <Text type="secondary">Loading results...</Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <Card>
          <Empty
            description={
              <div>
                <Title level={4}>Error Loading Results</Title>
                <Text type="danger">{error}</Text>
              </div>
            }
          >
            <Button type="primary" onClick={safeNavigateToDashboard}>
              Return to Dashboard
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  // No data state
  if (!finalScore && (!questions?.length || !answers?.length)) {
    return (
      <div className="p-8">
        <Card>
          <Empty description="No interview data found">
            <Space>
              <Button type="primary" onClick={safeNavigateToDashboard}>
                Back to Dashboard
              </Button>
              <Button onClick={safeRetakeInterview}>Start New Interview</Button>
            </Space>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl mb-4">
          <TrophyFilled className="text-4xl text-white" />
        </div>
        <Title level={2}>Interview Completed!</Title>
        <Paragraph className="text-slate-600">
          Congratulations, {profile?.name || ""}! You've completed the
          interview. Here's your performance summary.
        </Paragraph>
      </div>

      {/* Overall Score Card */}
      <Card className="mb-8 shadow-sm">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8} className="text-center">
            <Progress
              type="circle"
              percent={finalScore || 0}
              format={(percent) => (
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold">{percent}</span>
                  <span className="text-sm text-slate-500">Score</span>
                </div>
              )}
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              strokeWidth={10}
              size={160}
            />
          </Col>

          <Col xs={24} md={16}>
            <Title level={4}>Overall Assessment</Title>
            <Paragraph className="text-slate-600">
              {finalSummary || "No detailed feedback available."}
            </Paragraph>

            {metrics && (
              <Row gutter={[16, 16]} className="mt-4">
                <Col span={8}>
                  <Statistic
                    title="Questions"
                    value={metrics.totalQuestions}
                    suffix={`/${metrics.totalQuestions}`}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Accuracy"
                    value={metrics.accuracyPercent}
                    suffix="%"
                    valueStyle={{
                      color:
                        metrics.accuracyPercent >= 80
                          ? "#3f8600"
                          : metrics.accuracyPercent >= 60
                          ? "#faad14"
                          : "#cf1322",
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Avg. Time"
                    value={metrics.averageTime}
                    suffix="sec"
                  />
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Card>

      {/* Enhanced Detailed Analysis with Tabs */}
      <Card className="mb-8 shadow-sm">
        <Tabs
          defaultActiveKey="1"
          className="detailed-analysis-tabs"
          items={[
            {
              key: "1",
              label: (
                <span>
                  <InfoCircleOutlined className="mr-2" />
                  Interview Details
                </span>
              ),
              children: (
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Configuration">
                      <Space direction="vertical" className="w-full">
                        <div className="flex justify-between">
                          <Text>Job Role:</Text>
                          <Tag color="blue">
                            {settings?.role || "Not specified"}
                          </Tag>
                        </div>
                        <div className="flex justify-between">
                          <Text>Duration:</Text>
                          <Tag color="green">
                            {settings?.duration || 10} minutes
                          </Tag>
                        </div>
                        <div className="flex justify-between">
                          <Text>Complexity:</Text>
                          <Tag color="orange">
                            {settings?.complexity || "balanced"}
                          </Tag>
                        </div>
                        <div className="flex justify-between">
                          <Text>Focus Area:</Text>
                          <Tag color="purple">
                            {settings?.focusArea || "full-coverage"}
                          </Tag>
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small" title="Session Stats">
                      <Space direction="vertical" className="w-full">
                        <div className="flex justify-between">
                          <Text>Total Time:</Text>
                          <Text strong>
                            {Math.floor((metrics?.totalTimeSpent || 0) / 60)}m{" "}
                            {(metrics?.totalTimeSpent || 0) % 60}s
                          </Text>
                        </div>
                        <div className="flex justify-between">
                          <Text>Questions Skipped:</Text>
                          <Badge count={metrics?.skippedQuestions || 0} />
                        </div>
                        <div className="flex justify-between">
                          <Text>Timed Out:</Text>
                          <Badge count={metrics?.timedOutQuestions || 0} />
                        </div>
                        <div className="flex justify-between">
                          <Text>Completion Rate:</Text>
                          <Text strong>{metrics?.completionRate || 0}%</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "2",
              label: (
                <span>
                  <BarChartOutlined className="mr-2" />
                  Performance Analysis
                </span>
              ),
              children: (
                <Row gutter={[24, 16]}>
                  {metrics?.difficultyStats &&
                    Object.entries(metrics.difficultyStats).map(
                      ([level, stats]) => (
                        <Col xs={24} md={8} key={level}>
                          <Card size="small">
                            <Statistic
                              title={`${level.toUpperCase()} Questions`}
                              value={stats.correct}
                              suffix={`/ ${stats.total}`}
                              prefix={
                                level === "easy" ? (
                                  <BulbOutlined />
                                ) : level === "medium" ? (
                                  <ThunderboltOutlined />
                                ) : (
                                  <FireOutlined />
                                )
                              }
                              valueStyle={{
                                color:
                                  stats.correct / stats.total >= 0.8
                                    ? "#3f8600"
                                    : stats.correct / stats.total >= 0.6
                                    ? "#faad14"
                                    : "#cf1322",
                              }}
                            />
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <Text type="secondary">Avg Score:</Text>
                                <Text>
                                  {Math.round(
                                    (stats.totalScore / stats.total) * 10
                                  ) / 10}
                                  /10
                                </Text>
                              </div>
                              <div className="flex justify-between text-sm">
                                <Text type="secondary">Avg Time:</Text>
                                <Text>
                                  {Math.round(stats.totalTime / stats.total)}s
                                </Text>
                              </div>
                              <div className="flex justify-between text-sm">
                                <Text type="secondary">Timeouts:</Text>
                                <Text>{stats.timeOuts}</Text>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    )}
                </Row>
              ),
            },
            {
              key: "3",
              label: (
                <span>
                  <BookOutlined className="mr-2" />
                  Question Details
                </span>
              ),
              children: (
                <Collapse
                  ghost
                  items={
                    questions?.map((question, index) => {
                      const answer = answers?.[index];
                      const timeEffData = metrics?.timeEfficiency?.[index];

                      return {
                        key: String(index),
                        label: (
                          <div className="flex justify-between items-center w-full pr-4">
                            <span>
                              <Badge
                                status={
                                  answer?.score >= 8
                                    ? "success"
                                    : answer?.score >= 6
                                    ? "warning"
                                    : "error"
                                }
                              />
                              Q{index + 1}: {question?.text?.substring(0, 80)}
                              ...
                            </span>
                            <div className="flex gap-2">
                              <Tag color={getScoreColor(answer?.score)}>
                                {answer?.score || 0}/10
                              </Tag>
                              <Tag color="blue">
                                {timeEffData?.timeSpent || 0}s
                              </Tag>
                            </div>
                          </div>
                        ),
                        children: (
                          <div className="space-y-4">
                            <div>
                              <Text strong>Question:</Text>
                              <Paragraph className="mt-2">
                                {question?.text || question?.question}
                              </Paragraph>
                              <div className="flex gap-2 mb-3">
                                <Tag>{question?.level || "medium"}</Tag>
                                <Tag>
                                  {question?.metadata?.focusArea || "general"}
                                </Tag>
                                <Tag color="blue">
                                  {question?.seconds || 60}s allocated
                                </Tag>
                              </div>
                            </div>

                            <div>
                              <Text strong>Your Answer:</Text>
                              <Paragraph
                                className={`mt-2 p-3 rounded ${
                                  answer?.wasSkipped || !answer?.answer
                                    ? "bg-orange-50 border border-orange-200"
                                    : answer?.score < 6
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-gray-50"
                                }`}
                              >
                                {(() => {
                                  if (answer?.wasSkipped || !answer?.answer) {
                                    return (
                                      <span className="text-orange-600 italic">
                                        Question was not attempted
                                      </span>
                                    );
                                  }
                                  if (answer?.answer) {
                                    return typeof answer.answer === "string"
                                      ? answer.answer
                                      : JSON.stringify(answer.answer, null, 2);
                                  }
                                  return (
                                    <span className="text-gray-500 italic">
                                      No answer provided
                                    </span>
                                  );
                                })()}
                              </Paragraph>
                            </div>

                            {(answer?.score < 8 ||
                              answer?.wasSkipped ||
                              !answer?.answer) && (
                              <div>
                                <Text strong className="text-green-600">
                                  <CheckCircleFilled className="mr-1" />
                                  Correct Answer:
                                </Text>
                                <Paragraph className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                  {(() => {
                                    if (question?.correctAnswer) {
                                      return typeof question.correctAnswer ===
                                        "string"
                                        ? question.correctAnswer
                                        : JSON.stringify(
                                            question.correctAnswer,
                                            null,
                                            2
                                          );
                                    }
                                    if (question?.answerKey)
                                      return question.answerKey;
                                    if (question?.explanation)
                                      return question.explanation;
                                    return (
                                      <span className="text-gray-500 italic">
                                        Correct answer not available for this
                                        question
                                      </span>
                                    );
                                  })()}
                                </Paragraph>

                                {question?.explanation &&
                                  question?.explanation !==
                                    question?.correctAnswer && (
                                    <div className="mt-2">
                                      <Text strong className="text-blue-600">
                                        Explanation:
                                      </Text>
                                      <Paragraph className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                        {question.explanation}
                                      </Paragraph>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        ),
                      };
                    }) || []
                  }
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          icon={<HomeOutlined />}
          size="large"
          onClick={safeNavigateToDashboard}
        >
          Return to Dashboard
        </Button>
        {/* <Button
          type="primary"
          icon={<ReloadOutlined />}
          size="large"
          onClick={safeRetakeInterview}
        >
          Take Another Interview
        </Button> */}
      </div>
    </div>
  );
};

export default SummaryPage;
