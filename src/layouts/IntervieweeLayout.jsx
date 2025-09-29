import React, { useState } from "react";
import { Layout, Dropdown, Space, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Brain, User, Home } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

const IntervieweeLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6">
        <div className="container mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
              AI Interview Assistant
            </span>
          </div>

          {/* User Menu */}
          <Space>
            <Dropdown
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              menu={{
                items: [
                  {
                    key: "home",
                    label: "Back to Home",
                    onClick: () => navigate("/"),
                    icon: <Home className="w-3 h-3" />,
                  },
                ],
              }}
            >
              <Button type="text" onClick={toggleMenu}>
                <Space>
                  <UserOutlined />
                  Interviewee
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>

      {/* Main Content */}
      <Layout>
        <Content className="container mx-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default IntervieweeLayout;
