import React from 'react';
import { Progress } from 'antd';

const Timer = ({ totalSeconds, secondsLeft }) => {
  const percent = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);
  const status = secondsLeft <= 5 ? 'exception' : 'active';
  return <Progress percent={percent} status={status} showInfo format={() => `${secondsLeft}s`} />;
};

export default Timer;
