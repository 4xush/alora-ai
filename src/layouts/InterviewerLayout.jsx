import React from "react";
import { Layout, Typography, Dropdown, Space, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

const InterviewerLayout = () => {
  const navigate = useNavigate();

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
                  Interviewer
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
    </Layout>
  );
};

export default InterviewerLayout;
