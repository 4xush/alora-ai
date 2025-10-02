import React from "react";
import { Spin, Typography } from "antd";
import AppLayout from "../../layouts/AppLayout.jsx";

const { Text } = Typography;

const LayoutAwareLoader = ({ message = "Loading page..." }) => {
  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-gray-600">{message}</Text>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LayoutAwareLoader;
