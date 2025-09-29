import React from "react";
import { Alert, Button, Card, Typography, Space } from "antd";
import { BugOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Card style={{ margin: "20px" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <BugOutlined style={{ fontSize: "48px", color: "#ff4d4f" }} />
              <Title level={3}>Something went wrong</Title>
            </div>

            <Alert
              message="Application Error"
              description={
                <div>
                  <Text>
                    An error occurred in the application. The development team
                    has been notified.
                  </Text>
                  <div style={{ marginTop: "15px" }}>
                    <Text type="danger" code>
                      {this.state.error && this.state.error.toString()}
                    </Text>
                  </div>
                </div>
              }
              type="error"
              showIcon
            />

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Reload Application
              </Button>

              {this.props.onReset && (
                <Button
                  style={{ marginLeft: "10px" }}
                  onClick={this.props.onReset}
                >
                  Return to Dashboard
                </Button>
              )}
            </div>
          </Space>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
