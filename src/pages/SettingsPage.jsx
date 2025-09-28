import React from "react";
import { Card, Input, Slider, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setDuration, setRole } from "../store/settingsSlice";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { duration, role } = useSelector((s) => s.settings);

  return (
    <Card title="Settings">
      <p>
        Configure app options locally. These settings persist in your browser.
      </p>
      <div style={{ maxWidth: 480 }}>
        <Typography.Title level={5}>Interview Duration</Typography.Title>
        <Slider
          min={5}
          max={30}
          step={5}
          value={duration}
          onChange={(val) => dispatch(setDuration(val))}
          marks={{ 5: "5", 10: "10", 15: "15", 20: "20", 25: "25", 30: "30" }}
        />
        <Typography.Text>{duration} minutes</Typography.Text>

        <Typography.Title level={5} style={{ marginTop: 24 }}>
          Interview Role
        </Typography.Title>
        <Input
          value={role}
          onChange={(e) => dispatch(setRole(e.target.value))}
        />

        <Typography.Title level={5} style={{ marginTop: 24 }}>
          Gemini API Key
        </Typography.Title>
        <Input.Password
          placeholder="Set VITE_GEMINI_API_KEY in .env for production builds"
          disabled
        />
      </div>
    </Card>
  );
};

export default SettingsPage;
