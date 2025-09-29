import React, { useState } from "react";
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
  Collapse,
  Empty,
  Spin,
  message,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
  HomeOutlined,
  ReloadOutlined,
  PercentageOutlined,
  StarFilled,
} from "@ant-design/icons";
import useInterviewFlow from "../../hooks/interviewee/useInterviewFlow";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * SummaryPage shows the interview results and provides feedback
 */
const SummaryPage = () => {
  const navigate = useNavigate();

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

  // Safe navigation functions with fallback
  const safeNavigateToDashboard = () => {
    console.log("Navigating to dashboard");
    try {
      if (handleBackToDashboard) {
        handleBackToDashboard();
      } else {
        console.warn("handleBackToDashboard is undefined, using fallback");
        navigate("/interviewee/dashboard");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      message.error("Navigation error, redirecting...");
      // Ultimate fallback
      window.location.href = "/interviewee/dashboard";
    }
  };

  const safeRetakeInterview = () => {
    console.log("Starting new interview");
    try {
      if (handleRetakeInterview) {
        handleRetakeInterview();
      } else {
        console.warn("handleRetakeInterview is undefined, using fallback");
        navigate("/interviewee/pre-interview");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      message.error("Navigation error, redirecting...");
      // Ultimate fallback
      window.location.href = "/interviewee/pre-interview";
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    console.log("Calculating metrics with", { questions, answers });
    if (!questions?.length || !answers?.length) return null;

    const answeredQuestions = answers.filter(
      (answer) =>
        answer &&
        answer.answer !== undefined &&
        (typeof answer.answer === "string" || typeof answer.answer === "number")
    );
    const correctAnswers = answers.filter(
      (answer) => answer && answer.score >= 8
    );
    const averageTime =
      answers.reduce((acc, answer) => acc + (answer?.secondsSpent || 0), 0) /
      (answers.length || 1); // Prevent division by zero

    // Group by difficulty
    const difficultyStats = questions.reduce((acc, question, index) => {
      const level = question?.level || "medium";
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
        (correctAnswers.length / (questions.length || 1)) * 100
      ),
      averageTime: Math.round(averageTime),
      completionRate: Math.round(
        (answeredQuestions.length / (questions.length || 1)) * 100
      ),
      difficultyStats,
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
                    prefix={<PercentageOutlined />}
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

      {/* Detailed Answers */}
      <Card
        title="Question Breakdown"
        className="mb-8 shadow-sm"
        tabList={[
          { key: "overview", tab: "Overview" },
          { key: "details", tab: "Detailed Feedback" },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === "overview" ? (
          <List
            dataSource={
              questions?.map((q, i) => ({
                question: q,
                answer: answers?.[i],
                index: i,
              })) || []
            }
            renderItem={({ question, answer, index }) => (
              <List.Item
                actions={[
                  <Tag
                    key="score"
                    color={getScoreColor(answer?.score)}
                    className="px-2 py-1"
                  >
                    Score: {answer?.score || "N/A"}
                  </Tag>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    answer?.score >= 8 ? (
                      <CheckCircleFilled className="text-xl text-green-500" />
                    ) : (
                      <CloseCircleFilled className="text-xl text-red-500" />
                    )
                  }
                  title={
                    <div className="font-medium">
                      Q{index + 1}: {question?.text || question?.question}
                    </div>
                  }
                  description={
                    <div className="mt-1">
                      <Text type="secondary" className="text-sm">
                        Your answer:{" "}
                        <Text
                          type="secondary"
                          className="text-sm"
                          style={{ fontStyle: "italic" }}
                        >
                          {(function () {
                            // Use originalAnswer if available (preferred way)
                            if (answer?.originalAnswer?.answer) {
                              const originalAns = answer.originalAnswer.answer;
                              if (typeof originalAns === "string") {
                                return (
                                  originalAns.substring(0, 100) +
                                  (originalAns.length > 100 ? "..." : "")
                                );
                              }
                              return String(originalAns);
                            }

                            // Try to parse stringified JSON answer
                            if (
                              answer?.answer &&
                              typeof answer.answer === "string"
                            ) {
                              try {
                                // Check if it's a JSON string that needs parsing
                                if (
                                  answer.answer.startsWith("{") &&
                                  answer.answer.includes('"answer":')
                                ) {
                                  const parsedAnswer = JSON.parse(
                                    answer.answer
                                  );
                                  if (parsedAnswer.answer) {
                                    const text = parsedAnswer.answer;
                                    return typeof text === "string"
                                      ? text.substring(0, 100) +
                                          (text.length > 100 ? "..." : "")
                                      : String(text);
                                  }
                                }

                                // Regular string answer
                                return (
                                  answer.answer.substring(0, 100) +
                                  (answer.answer.length > 100 ? "..." : "")
                                );
                              } catch (e) {
                                // If JSON parsing fails, just return the string as is
                                return (
                                  answer.answer.substring(0, 100) +
                                  (answer.answer.length > 100 ? "..." : "")
                                );
                              }
                            }

                            // Handle direct object answers
                            if (
                              answer?.answer &&
                              typeof answer.answer === "object"
                            ) {
                              // This might be an MCQ answer object
                              if (
                                answer.answer.answer &&
                                typeof answer.answer.answer === "string"
                              ) {
                                const text = answer.answer.answer;
                                return (
                                  text.substring(0, 100) +
                                  (text.length > 100 ? "..." : "")
                                );
                              }

                              // Try extracting from options if present
                              if (
                                answer.answer.options &&
                                answer.answer.selectedOption !== undefined
                              ) {
                                const selectedIdx =
                                  answer.answer.selectedOption;
                                if (answer.answer.options[selectedIdx]) {
                                  return answer.answer.options[selectedIdx];
                                }
                              }

                              // Simplified object display
                              return "Selected answer";
                            }

                            // Fallback
                            return answer?.answer
                              ? String(answer.answer)
                              : "No answer provided";
                          })()}
                        </Text>
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Collapse defaultActiveKey={["0"]}>
            {questions?.map((question, index) => {
              const answer = answers?.[index];
              return (
                <Panel
                  key={index}
                  header={
                    <div className="flex justify-between items-center">
                      <span>
                        Question {index + 1}:{" "}
                        {question?.text || question?.question}
                      </span>
                      <Space>
                        {answer?.score && (
                          <Tag
                            color={getScoreColor(answer.score)}
                            className="ml-4"
                          >
                            Score: {answer.score}/10
                          </Tag>
                        )}
                      </Space>
                    </div>
                  }
                >
                  <div className="bg-slate-50 p-4 rounded-md mb-4">
                    <Text strong>Your Answer:</Text>
                    <Paragraph className="mt-2">
                      {(function () {
                        // Use originalAnswer if available (preferred way)
                        if (answer?.originalAnswer?.answer) {
                          return answer.originalAnswer.answer;
                        }

                        // Try to parse stringified JSON answer
                        if (
                          answer?.answer &&
                          typeof answer.answer === "string"
                        ) {
                          try {
                            // Check if it's a JSON string that needs parsing
                            if (
                              answer.answer.startsWith("{") &&
                              answer.answer.includes('"answer":')
                            ) {
                              const parsedAnswer = JSON.parse(answer.answer);
                              if (parsedAnswer.answer) {
                                return parsedAnswer.answer;
                              }
                            }

                            // Non-JSON string answer
                            return answer.answer;
                          } catch (e) {
                            // If parsing fails, just return the raw string
                            return answer.answer;
                          }
                        }

                        // Handle direct object answers
                        if (
                          answer?.answer &&
                          typeof answer.answer === "object"
                        ) {
                          // This might be an MCQ answer object
                          if (
                            answer.answer.answer &&
                            typeof answer.answer.answer === "string"
                          ) {
                            return answer.answer.answer;
                          }

                          // Try extracting from options if present
                          if (
                            answer.answer.options &&
                            answer.answer.selectedOption !== undefined
                          ) {
                            const selectedIdx = answer.answer.selectedOption;
                            if (answer.answer.options[selectedIdx]) {
                              return answer.answer.options[selectedIdx];
                            }
                          }

                          // Only show a simplified version of the object, not the full JSON
                          return "Selected answer";
                        }

                        // Last resort fallback
                        return "No answer provided";
                      })()}
                    </Paragraph>
                  </div>

                  {answer?.explanation && (
                    <div>
                      <Text strong>Feedback:</Text>
                      <Paragraph className="mt-2">
                        {answer.explanation}
                      </Paragraph>
                    </div>
                  )}

                  {(question?.idealAnswer ||
                    question?.correctAnswer ||
                    answer?.originalAnswer?.correctAnswer) && (
                    <div className="mt-4 border-t pt-4">
                      <Text strong>Correct Answer:</Text>
                      <Paragraph className="mt-2 text-green-700">
                        {question.idealAnswer ||
                          question.correctAnswer ||
                          answer?.originalAnswer?.correctAnswer ||
                          "Not available"}
                      </Paragraph>
                    </div>
                  )}
                </Panel>
              );
            })}
          </Collapse>
        )}
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
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          size="large"
          onClick={safeRetakeInterview}
        >
          Take Another Interview
        </Button>
      </div>
    </div>
  );
};

export default SummaryPage;
