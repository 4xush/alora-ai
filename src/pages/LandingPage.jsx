import React from "react";
import { Layout, Button, Typography, Row, Col, Card } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ padding: "50px", textAlign: "center" }}>
        <Title style={{ color: "#7c3aed" }}>AI Interview Assistant</Title>
        <Paragraph
          style={{ fontSize: "18px", color: "#555", marginBottom: "50px" }}
        >
          Your personal AI-powered assistant to conduct or take interviews
          seamlessly.
        </Paragraph>
        <Row gutter={16} justify="center">
          <Col>
            <Card
              hoverable
              style={{ width: 300 }}
              onClick={() => navigate("/interviewee")}
            >
              <Title level={3}>For Interviewees</Title>
              <Paragraph>
                Take a timed, AI-generated interview tailored to your resume and
                desired role.
              </Paragraph>
              <Button type="primary" icon={<ArrowRightOutlined />}>
                Start Interview
              </Button>
            </Card>
          </Col>
          <Col>
            <Card
              hoverable
              style={{ width: 300 }}
              onClick={() => navigate("/interviewer")}
            >
              <Title level={3}>For Interviewers</Title>
              <Paragraph>
                Review candidate performance, including scores, transcripts, and
                AI-generated summaries.
              </Paragraph>
              <Button type="primary" icon={<ArrowRightOutlined />}>
                View Dashboard
              </Button>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LandingPage;
