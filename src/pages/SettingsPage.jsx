import React from 'react';
import { Card, Input } from 'antd';

const SettingsPage = () => {
  return (
    <Card title="Settings">
      <p>Configure app options locally. These settings persist in your browser.</p>
      <div style={{ maxWidth: 360 }}>
        <label>Gemini API Key (stored only in your browser for demo)</label>
        <Input.Password placeholder="Set VITE_GEMINI_API_KEY in .env for production builds" disabled />
      </div>
    </Card>
  );
};

export default SettingsPage;
