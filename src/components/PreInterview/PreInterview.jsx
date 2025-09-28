import React from "react";
import { Card, Typography, Space, Button, Progress, Input, Alert } from "antd";
import ResumeUploader from "../ResumeUploader/ResumeUploader.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setProfile } from "../../store/intervieweeSlice.js";

const PreInterview = ({ onStart, error }) => {
  const dispatch = useDispatch();
  const { profile, resume, inProgress } = useSelector((s) => s.interviewee);

  const canStart = profile.email && profile.name && resume.text;

  return (
    <Card title="Upload Resume & Details" bordered>
      <Space direction="vertical" style={{ width: "100%" }}>
        <ResumeUploader />
        <Input
          placeholder="Name"
          value={profile.name}
          onChange={(e) => dispatch(setProfile({ name: e.target.value }))}
        />
        <Input
          placeholder="Email"
          value={profile.email}
          onChange={(e) => dispatch(setProfile({ email: e.target.value }))}
        />
        <Input
          placeholder="Phone"
          value={profile.phone}
          onChange={(e) => dispatch(setProfile({ phone: e.target.value }))}
        />
        {error && <Alert type="error" message={error} />}
        <Button
          type="primary"
          onClick={onStart}
          disabled={!canStart || inProgress}
        >
          {inProgress ? "Starting..." : "Start Interview"}
        </Button>
      </Space>
    </Card>
  );
};

export default PreInterview;
