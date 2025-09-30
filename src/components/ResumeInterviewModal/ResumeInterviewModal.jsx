import React from "react";
import { Modal, Button, Typography, Progress, Space } from "antd";
import { PlayCircleOutlined, UndoOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ResumeInterviewModal = ({
  open,
  onResume,
  onStartNew,
  loading,
  resumableInfo,
}) => {
  const { questionIndex, totalQuestions } = resumableInfo || {};
  const progressPercent =
    totalQuestions > 0 ? Math.round((questionIndex / totalQuestions) * 100) : 0;

  return (
    <Modal
      title="Resume Previous Interview"
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      className="top-20"
      bodyStyle={{ padding: "16px" }}
    >
      <div className="py-2">
        <Text className="block mb-4 text-gray-600 text-sm">
          You have an interview in progress. Would you like to resume where you
          left off?
        </Text>

        {resumableInfo && totalQuestions > 0 && (
          <div className="mb-4">
            <Text strong>Your Progress:</Text>
            <Progress
              percent={progressPercent}
              format={() =>
                `Question ${questionIndex + 1} of ${totalQuestions}`
              }
            />
            <Text type="secondary" className="text-xs">
              {questionIndex} questions answered,{" "}
              {totalQuestions - questionIndex} left.
            </Text>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={onStartNew} icon={<UndoOutlined />} size="middle">
            Start New
          </Button>
          <Button
            type="primary"
            onClick={onResume}
            loading={loading}
            icon={<PlayCircleOutlined />}
            size="middle"
          >
            Resume Interview
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeInterviewModal;
