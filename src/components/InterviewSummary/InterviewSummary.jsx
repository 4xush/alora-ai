import React from "react";
import { Card, Typography, Space, Progress, List, Divider, Button } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { resetInterview } from "../../store/intervieweeSlice.js";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const InterviewSummary = ({ score, summary }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, answers } = useSelector((s) => s.interviewee);

  // Calculate different metrics for visual presentation
  const scoreColor =
    score >= 80 ? "#52c41a" : score >= 60 ? "#faad14" : "#f5222d";
  const correctAnswers = answers.filter((answer) => answer.score >= 8).length;
  const percentCorrect =
    Math.round((correctAnswers / questions.length) * 100) || 0;

  const handleStartOver = () => {
    dispatch(resetInterview());
    navigate("/interviewee");
  };

  return (
    <Card title="Interview Results" bordered>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Progress
            type="circle"
            percent={score || 0}
            format={(percent) => `${percent}%`}
            strokeColor={scoreColor}
            width={120}
          />
          <Title level={3} style={{ marginTop: 16 }}>
            {score >= 80
              ? "Excellent!"
              : score >= 60
              ? "Good Job!"
              : "Keep Practicing!"}
          </Title>
        </div>

        <Card style={{ marginBottom: 24, background: "#f9f9f9" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={4}>Summary</Title>
            <Paragraph>{summary || "No summary available."}</Paragraph>

            <Divider />

            <Space size="large">
              <div>
                <Text type="secondary">Questions</Text>
                <div>
                  <Text strong style={{ fontSize: 20 }}>
                    {questions.length}
                  </Text>
                </div>
              </div>

              <div>
                <Text type="secondary">Correct</Text>
                <div>
                  <Text strong style={{ fontSize: 20, color: "#52c41a" }}>
                    {correctAnswers}
                  </Text>
                </div>
              </div>

              <div>
                <Text type="secondary">Accuracy</Text>
                <div>
                  <Text strong style={{ fontSize: 20 }}>
                    {percentCorrect}%
                  </Text>
                </div>
              </div>
            </Space>
          </Space>
        </Card>

        <Title level={4}>Question Details</Title>
        <List
          itemLayout="horizontal"
          dataSource={questions.map((q, i) => ({
            question: q,
            answer: answers[i] || {},
          }))}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  item.answer.score >= 8 ? (
                    <CheckCircleFilled
                      style={{ color: "#52c41a", fontSize: 24 }}
                    />
                  ) : (
                    <CloseCircleFilled
                      style={{ color: "#f5222d", fontSize: 24 }}
                    />
                  )
                }
                title={`Q${index + 1}: ${item.question.text}`}
                description={
                  <>
                    <Text>
                      Your answer: {item.answer.answer || "Not answered"}
                    </Text>
                    {item.question.correctAnswer && (
                      <div>
                        <Text type="secondary">
                          Correct answer: {item.question.correctAnswer}
                        </Text>
                      </div>
                    )}
                    {item.answer.explanation && (
                      <div>
                        <Text type="secondary">{item.answer.explanation}</Text>
                      </div>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button type="primary" size="large" onClick={handleStartOver}>
            Start New Interview
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default InterviewSummary;
