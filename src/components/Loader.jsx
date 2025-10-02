import { Spin, Typography } from "antd";

const { Text } = Typography;

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center min-h-screen">
          <Spin size="large" />
        </div>
      </div>
    </div>
  );
}
