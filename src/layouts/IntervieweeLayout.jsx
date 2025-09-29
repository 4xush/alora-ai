import React, { useEffect } from "react";
import { Layout, Typography, Dropdown, Space, Button, Modal } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { uiActions } from "../store/uiSlice.js";
import { resumeInterview, resetInterview } from "../store/intervieweeSlice.js";

const { Header, Content } = Layout;

const IntervieweeLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showWelcomeBack } = useSelector((s) => s.ui);
  const { inProgress } = useSelector((s) => s.interviewee);

  useEffect(() => {
    if (inProgress) {
      dispatch(uiActions.setShowWelcomeBack(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = () => {
    dispatch(resumeInterview());
    dispatch(uiActions.setShowWelcomeBack(false));
  };

  const handleStartOver = () => {
    dispatch(resetInterview());
    dispatch(uiActions.setShowWelcomeBack(false));
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography.Title
            level={4}
            style={{ margin: 0, color: "#7c3aed", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            AI Interview Assistant
          </Typography.Title>
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "home",
                    label: "Back to Home",
                    onClick: () => navigate("/"),
                  },
                ],
              }}
            >
              <Button type="text">
                <Space>
                  <UserOutlined />
                  Interviewee
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>
      <Layout>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="Welcome back"
        open={showWelcomeBack}
        okText="Resume"
        cancelText="Start Over"
        onOk={handleResume}
        onCancel={handleStartOver}
      >
        You have an interview in progress. Would you like to resume or start
        over?
      </Modal>
    </Layout>
  );
};

export default IntervieweeLayout;
