import React, { useEffect } from 'react';
import { Layout, Menu, Typography, Dropdown, Space, Button, Modal } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { uiActions } from './store/uiSlice.js';
import { resumeInterview } from './store/intervieweeSlice.js';

const { Header, Sider, Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showWelcomeBack } = useSelector((s) => s.ui);
  const { inProgress } = useSelector((s) => s.interviewee);

  useEffect(() => {
    if (inProgress) {
      dispatch(uiActions.setShowWelcomeBack(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKey =
    location.pathname === '/'
      ? 'interviewee'
      : location.pathname.includes('interviewer')
      ? 'interviewer'
      : 'settings';

  const onMenuClick = ({ key }) => {
    if (key === 'interviewee') navigate('/');
    if (key === 'interviewer') navigate('/interviewer');
    if (key === 'settings') navigate('/settings');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#7c3aed' }}>
            AI Interview Assistant
          </Typography.Title>
          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: 'Profile' },
                { key: 'logout', label: 'Logout' },
              ],
            }}
          >
            <Button type="text">
              <Space>
                <UserOutlined />
                Profile
              </Space>
            </Button>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider theme="light" width={220} style={{ borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={onMenuClick}
            items={[
              { key: 'interviewee', icon: <UserOutlined />, label: 'Interviewee' },
              { key: 'interviewer', icon: <TeamOutlined />, label: 'Interviewer' },
              { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
            ]}
          />
        </Sider>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="Welcome back"
        open={showWelcomeBack}
        okText="Resume"
        cancelText="Start Over"
        onOk={() => {
          dispatch(resumeInterview());
          dispatch(uiActions.setShowWelcomeBack(false));
        }}
        onCancel={() => {
          dispatch(uiActions.setShowWelcomeBack(false));
        }}
      >
        You have an interview in progress. Would you like to resume?
      </Modal>
    </Layout>
  );
};

export default App;
