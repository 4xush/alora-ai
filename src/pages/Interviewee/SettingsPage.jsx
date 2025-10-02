import React, { useState } from "react";
import {
  Card,
  Form,
  Select,
  Slider,
  Button,
  Typography,
  Alert,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  SaveOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Settings, Clock, Code, Brain, Target, Layers } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setDuration,
  setRole,
  setComplexity,
  setFocusArea,
} from "../../store/settingsSlice";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * Enhanced Professional Settings Page with REAL-TIME UPDATES
 */
const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);

  // Get current settings from Redux
  const { duration, role, complexity, focusArea } = useSelector(
    (state) => state.settings
  );

  // NEW: Real-time state for immediate UI updates
  const [currentDuration, setCurrentDuration] = useState(duration);
  const [currentRole, setCurrentRole] = useState(role);
  const [currentComplexity, setCurrentComplexity] = useState(
    complexity || "balanced"
  );
  const [currentFocusArea, setCurrentFocusArea] = useState(
    focusArea || "full-coverage"
  );

  // Enhanced role options
  const roleOptions = [
    {
      value: "Full-stack Engineer",
      label: "Full-stack Engineer",
      description: "Frontend, backend, databases, and system integration",
      color: "blue",
    },
    {
      value: "Frontend Developer",
      label: "Frontend Developer",
      description: "React, JavaScript, CSS, UI/UX, responsive design",
      color: "green",
    },
    {
      value: "Backend Developer",
      label: "Backend Developer",
      description: "APIs, databases, server-side logic, microservices",
      color: "orange",
    },
    {
      value: "DevOps Engineer",
      label: "DevOps Engineer",
      description: "CI/CD, cloud infrastructure, containerization",
      color: "purple",
    },
    {
      value: "Data Engineer",
      label: "Data Engineer",
      description: "Data pipelines, ETL, analytics, big data",
      color: "cyan",
    },
    {
      value: "Mobile Developer",
      label: "Mobile Developer",
      description: "iOS, Android, React Native, Flutter",
      color: "magenta",
    },
  ];

  // NEW: Complexity modes that actually affect question generation
  const complexityModes = [
    {
      value: "balanced",
      label: "🎯 Balanced Mix",
      description: "Equal focus on fundamentals and advanced concepts",
      color: "blue",
      icon: "🎯",
    },
    {
      value: "fundamentals",
      label: "📚 Fundamentals Focus",
      description:
        "Core concepts, basic implementations, foundational knowledge",
      color: "green",
      icon: "📚",
    },
    {
      value: "advanced",
      label: "🔥 Advanced Concepts",
      description: "Complex patterns, architecture, optimization, edge cases",
      color: "orange",
      icon: "🔥",
    },
    {
      value: "resume-focused",
      label: "📄 Resume Deep Dive",
      description: "Questions tailored specifically to your resume experience",
      color: "purple",
      icon: "📄",
    },
  ];

  // NEW: Technical focus areas
  const focusAreas = [
    {
      value: "full-coverage",
      label: "Full Coverage",
      description: "Balanced coverage of all technical areas",
      color: "blue",
    },
    {
      value: "frameworks",
      label: "Frameworks & Libraries",
      description: "Focus on specific frameworks and their ecosystems",
      color: "green",
    },
    {
      value: "algorithms",
      label: "Algorithms & Data Structures",
      description: "Problem-solving, complexity analysis, data structures",
      color: "purple",
    },
    {
      value: "system-design",
      label: "System Design",
      description: "Architecture, scalability, distributed systems",
      color: "orange",
    },
    {
      value: "practical",
      label: "Practical Implementation",
      description: "Real-world scenarios, debugging, best practices",
      color: "cyan",
    },
  ];

  // Enhanced duration logic - now actually affects question count
  const getQuestionCount = (duration) => {
    if (duration <= 10) return 6;
    if (duration <= 20) return 10;
    return 15;
  };

  const getQuestionDistribution = (duration) => {
    if (duration <= 10) {
      return "6 questions (2 easy, 3 medium, 1 hard)";
    } else if (duration <= 20) {
      return "10 questions (4 easy, 4 medium, 2 hard)";
    } else {
      return "15 questions (5 easy, 6 medium, 4 hard)";
    }
  };

  const durationMarks = {
    5: "5min",
    10: "10min",
    15: "15min",
    20: "20min",
    30: "30min",
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Dispatch all settings to Redux store
      dispatch(setDuration(values.duration));
      dispatch(setRole(values.role));
      dispatch(setComplexity(values.complexity));
      dispatch(setFocusArea(values.focusArea));

      setHasChanges(false);
      message.success(
        "Settings saved successfully! Your next interview will use these preferences."
      );
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fix the form errors before saving.");
    }
  };

  const handleReset = () => {
    form.setFieldsValue({ duration, role, complexity, focusArea });
    setCurrentDuration(duration);
    setCurrentRole(role);
    setCurrentComplexity(complexity || "balanced");
    setCurrentFocusArea(focusArea || "full-coverage");
    setHasChanges(false);
    message.info("Settings reset to current values");
  };

  // FIXED: Real-time form change handler
  const handleFormChange = (changedValues, allValues) => {
    setHasChanges(true);

    // Update real-time state for immediate UI feedback
    if (changedValues.duration !== undefined) {
      setCurrentDuration(changedValues.duration);
    }
    if (changedValues.role !== undefined) {
      setCurrentRole(changedValues.role);
    }
    if (changedValues.complexity !== undefined) {
      setCurrentComplexity(changedValues.complexity);
    }
    if (changedValues.focusArea !== undefined) {
      setCurrentFocusArea(changedValues.focusArea);
    }
  };
  const handleBackToDashboard = () => {
    if (hasChanges) {
      message.warning(
        "You have unsaved changes. Please save or reset before leaving."
      );
      return;
    }
    navigate("/interviewee/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <Title level={2} className="mb-1">
                  Interview Settings
                </Title>
                <Text className="text-gray-600">
                  Customize your interview experience with meaningful
                  preferences
                </Text>
              </div>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToDashboard}
              className="flex items-center"
              size="large"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            duration,
            role,
            complexity: complexity || "balanced",
            focusArea: focusArea || "full-coverage",
          }}
          onValuesChange={handleFormChange} // FIXED: Now updates real-time state
          className="space-y-6"
        >
          {/* Core Interview Configuration */}
          <Card className="shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <Title level={4} className="mb-0">
                Core Interview Configuration
              </Title>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Role Selection */}
              <div>
                <Form.Item
                  name="role"
                  label={
                    <div className="flex items-center space-x-2">
                      <Code className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Job Role</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please select a job role" },
                  ]}
                >
                  <Select
                    placeholder="Select your target role"
                    size="large"
                    listHeight={400}
                    style={{ fontSize: "1.1em", height: "48px" }}
                    className="text-lg"
                  >
                    {roleOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        <div className="flex items-center justify-between py-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {option.description}
                            </div>
                          </div>
                          <Tag
                            color={option.color}
                            className="ml-3 flex-shrink-0"
                          >
                            {option.value.split(" ")[0]}
                          </Tag>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Alert
                  message="Role-Specific Questions"
                  description="Questions will be tailored to your selected role with relevant technologies and concepts."
                  type="info"
                  showIcon
                  className="mt-3 text-xs"
                  style={{ padding: "8px", fontSize: "0.85em" }}
                />
              </div>

              {/* Duration Setting - FIXED with real-time updates */}
              <div>
                <Form.Item
                  name="duration"
                  label={
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Interview Duration</span>
                      <Tooltip title="Duration now affects the number of questions you'll receive">
                        <QuestionCircleOutlined className="text-gray-400" />
                      </Tooltip>
                    </div>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Please set interview duration",
                    },
                  ]}
                >
                  <div className="space-y-4">
                    <Slider
                      value={currentDuration}
                      marks={durationMarks}
                      step={5}
                      min={5}
                      max={30}
                      onChange={(value) => {
                        setCurrentDuration(value); // Update real-time state
                        setHasChanges(true); // Enable save button
                        form.setFieldsValue({ duration: value }); // Update form value
                      }}
                      tooltip={{
                        formatter: (value) =>
                          `${value} minutes → ${getQuestionCount(
                            value
                          )} questions`,
                      }}
                    />
                    {/* FIXED: Now uses currentDuration for real-time updates */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Text strong className="text-blue-800">
                        {getQuestionDistribution(currentDuration)}
                      </Text>
                    </div>
                  </div>
                </Form.Item>
              </div>
            </div>
          </Card>

          {/* Advanced Configuration */}
          <Card className="shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <Title level={4} className="mb-0">
                Advanced Configuration
              </Title>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question Complexity */}
              <div>
                <Form.Item
                  name="complexity"
                  label={
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Question Complexity</span>
                    </div>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Please select complexity mode",
                    },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Select question complexity"
                    listHeight={400}
                    style={{ fontSize: "1.1em", height: "48px" }}
                    className="text-lg"
                  >
                    {complexityModes.map((mode) => (
                      <Option key={mode.value} value={mode.value}>
                        <div className="flex items-center justify-between py-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {mode.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {mode.description}
                            </div>
                          </div>
                          <Tag
                            color={mode.color}
                            className="ml-3 flex-shrink-0"
                          >
                            {mode.icon}
                          </Tag>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Technical Focus */}
              {/* Technical Focus */}
              <div>
                <Form.Item
                  name="focusArea"
                  label={
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Technical Focus</span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please select focus area" },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Select technical focus"
                    listHeight={400}
                    style={{ fontSize: "1.1em", height: "48px" }}
                    className="text-lg"
                  >
                    {focusAreas.map((area) => (
                      <Option key={area.value} value={area.value}>
                        <div className="flex items-center justify-between py-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {area.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {area.description}
                            </div>
                          </div>
                          <Tag
                            color={area.color}
                            className="ml-3 flex-shrink-0"
                          >
                            {area.value.split("-")[0]}
                          </Tag>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Alert
                  message="Focus Impact"
                  description="This determines which technical areas receive more emphasis in your questions."
                  type="info"
                  showIcon
                  className="mt-3 text-xs"
                  style={{ padding: "8px", fontSize: "0.85em" }}
                />
              </div>
            </div>
          </Card>

          {/* Current Configuration Preview - FIXED with real-time updates */}
          <Card className="shadow-sm border border-gray-200 bg-gradient-to-r from-violet-50 to-indigo-50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <SettingOutlined className="text-violet-600" />
              </div>
              <Title level={4} className="mb-0">
                Interview Preview
              </Title>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <BranchesOutlined className="text-blue-600 text-lg mb-2 block" />
                <Text strong className="block">
                  {currentRole}
                </Text>
                <Text className="text-xs text-gray-600">Role</Text>
              </div>

              <div className="text-center p-3 bg-white/50 rounded-lg">
                <ClockCircleOutlined className="text-orange-600 text-lg mb-2 block" />
                <Text strong className="block">
                  {getQuestionCount(currentDuration)} Questions
                </Text>
                <Text className="text-xs text-gray-600">
                  {currentDuration} minutes
                </Text>
              </div>

              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Layers className="w-4 h-4 text-purple-600 mx-auto mb-2" />
                <Text strong className="block">
                  {complexityModes
                    .find((m) => m.value === currentComplexity)
                    ?.label.replace(/[🎯📚🔥📄]/g, "")
                    .trim()}
                </Text>
                <Text className="text-xs text-gray-600">Complexity</Text>
              </div>

              <div className="text-center p-3 bg-white/50 rounded-lg">
                <Target className="w-4 h-4 text-green-600 mx-auto mb-2" />
                <Text strong className="block">
                  {focusAreas.find((f) => f.value === currentFocusArea)?.label}
                </Text>
                <Text className="text-xs text-gray-600">Focus</Text>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card
            className="shadow-sm border border-gray-200"
            bodyStyle={{ padding: "12px" }}
            size="medium"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-6"
                >
                  Save Settings
                </Button>

                <Button
                  size="middle"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  Reset
                </Button>
              </div>

              {hasChanges && (
                <Alert
                  message="Unsaved Changes"
                  description="Your preferences will be applied to the next interview."
                  type="warning"
                  showIcon
                  className="mb-0 text-xs"
                  style={{ padding: "8px", fontSize: "0.85em" }}
                />
              )}
            </div>
          </Card>

          {/* Help Section */}
          <Card className="shadow-sm border border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center">
                <QuestionCircleOutlined className="text-yellow-600" />
              </div>
              <Title level={5} className="mb-0 text-gray-800">
                How These Settings Affect Your Interview
              </Title>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
              <div>
                <Paragraph className="mb-2">
                  • <strong>Duration:</strong> Directly controls the number of
                  questions (6-15 questions)
                </Paragraph>
                <Paragraph className="mb-2">
                  • <strong>Role:</strong> Determines technology stack and
                  question relevance
                </Paragraph>
              </div>
              <div>
                <Paragraph className="mb-2">
                  • <strong>Complexity:</strong> Adjusts difficulty distribution
                  and depth
                </Paragraph>
                <Paragraph className="mb-0">
                  • <strong>Focus:</strong> Emphasizes specific technical areas
                  in questions
                </Paragraph>
              </div>
            </div>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default SettingsPage;
