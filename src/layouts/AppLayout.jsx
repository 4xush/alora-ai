import React, { useState } from "react";
import { Layout, Dropdown, Space, Button } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Brain, Home } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

/**
 * AppLayout - Unified layout component for both interviewer and interviewee views
 * @param {Object} props
 * @param {string} props.userRole - 'interviewer' or 'interviewee'
 */
const AppLayout = ({ userRole = "interviewee" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Automatically detect the user role from the URL if not explicitly provided
  const detectedRole = location.pathname.includes("/interviewer")
    ? "interviewer"
    : location.pathname.includes("/interviewee")
    ? "interviewee"
    : userRole;

  const isInterviewer = detectedRole === "interviewer";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Menu items based on role
  const menuItems = [
    {
      key: "home",
      label: "Home",
      onClick: () => navigate("/"),
      icon: <Home className="w-3 h-3" />,
    },
    // Add more role-specific menu items if needed
  ];

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header
        className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full px-0 py-1"
        style={{ height: "auto", lineHeight: "normal" }}
      >
        <div className="flex items-center justify-between h-12 w-full px-4 sm:px-6 lg:px-8 mx-auto">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer group py-1"
            onClick={() => navigate("/")}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
              AI Interview Assistant
            </span>
          </div>

          {/* User Menu */}
          <Space>
            <Dropdown
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              menu={{
                items: menuItems,
              }}
            >
              <Button
                type="text"
                onClick={toggleMenu}
                size="small"
                className="text-xs sm:text-sm h-8 px-3"
              >
                <Space size="small">
                  <UserOutlined className="text-xs" />
                  {isInterviewer ? "Interviewer" : "Interviewee"}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>

      {/* Main Content */}
      <Layout>
        <Content
          className="w-full mx-auto px-0"
          role="main"
          id="main-content"
          tabIndex="-1"
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
