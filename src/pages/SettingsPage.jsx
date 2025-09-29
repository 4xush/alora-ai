import React from "react";
import {
  Card,
  Typography,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Divider,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { Settings, Save } from "lucide-react";

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage = ({ userType = "interviewee" }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);
  const [form] = Form.useForm();

  const handleSaveSettings = (values) => {
    console.log("Saving settings:", values);
    // dispatch(updateSettings(values));
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <Card className="shadow-md rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <Title level={2} className="m-0">
            Settings
          </Title>
        </div>

        <Tabs defaultActiveKey="general">
          <Tabs.TabPane tab="General" key="general">
            <Form
              form={form}
              layout="vertical"
              initialValues={settings}
              onFinish={handleSaveSettings}
            >
              <Form.Item label="Interview Role" name="role">
                <Select placeholder="Select a role for your interview">
                  <Option value="frontend">Frontend Developer</Option>
                  <Option value="backend">Backend Developer</Option>
                  <Option value="fullstack">Full Stack Developer</Option>
                  <Option value="mobile">Mobile Developer</Option>
                  <Option value="devops">DevOps Engineer</Option>
                  <Option value="data">Data Scientist</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Experience Level" name="experienceLevel">
                <Select placeholder="Select your experience level">
                  <Option value="entry">Entry Level (0-2 years)</Option>
                  <Option value="mid">Mid Level (3-5 years)</Option>
                  <Option value="senior">Senior Level (6+ years)</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item label="Difficulty" name="difficulty">
                <Select placeholder="Select interview difficulty">
                  <Option value="easy">Easy</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="hard">Hard</Option>
                </Select>
              </Form.Item>

              {userType === "interviewee" && (
                <>
                  <Divider />
                  <Form.Item
                    label="Save Interview History"
                    name="saveHistory"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Text type="secondary" className="block mb-4">
                    When enabled, your interview results and history will be
                    saved for future reference.
                  </Text>
                </>
              )}

              <Form.Item className="mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Save className="w-4 h-4" />}
                  className="flex items-center"
                >
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          {userType === "interviewer" && (
            <Tabs.TabPane tab="Candidate Evaluation" key="evaluation">
              <Form layout="vertical">
                <Form.Item label="Default Scoring Rubric" name="scoringRubric">
                  <Select placeholder="Select a scoring rubric">
                    <Option value="standard">Standard Evaluation</Option>
                    <Option value="technical">Technical Focus</Option>
                    <Option value="comprehensive">
                      Comprehensive Assessment
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Auto-generate Candidate Summary"
                  name="autoSummary"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          )}

          <Tabs.TabPane tab="Account" key="account">
            <Form layout="vertical">
              <Form.Item
                label="Email Notifications"
                name="emailNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item label="Language" name="language">
                <Select defaultValue="en">
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                </Select>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
