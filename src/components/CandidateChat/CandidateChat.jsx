import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Typography, Space, Alert, Steps } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useInterviewTimer } from '../../hooks/useInterviewTimer.js';
import { nextQuestion } from '../../store/intervieweeSlice.js';
import Timer from '../Timer/Timer.jsx';

const CandidateChat = ({ onAnswer }) => {
  const dispatch = useDispatch();
  const { questions, currentQuestionIndex, paused, inProgress, answers } = useSelector((s) => s.interviewee);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [expired, setExpired] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalSeconds = useMemo(() => {
    if (!currentQuestion) return 0;
    if (currentQuestion.level === 'easy') return 20;
    if (currentQuestion.level === 'medium') return 60;
    return 120;
  }, [currentQuestion]);

  const { secondsLeft, reset } = useInterviewTimer(totalSeconds, () => setExpired(true), paused || !inProgress);

  useEffect(() => {
    // Reset timer on question change
    if (currentQuestion) {
      setExpired(false);
      reset(totalSeconds);
      const prev = answers.find((a) => a.questionId === currentQuestion.id);
      setCurrentAnswer(prev?.answer || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (expired && currentQuestion) {
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const isLast = currentQuestionIndex === questions.length - 1;

  const handleSubmit = (auto = false) => {
    if (!currentQuestion) return;
    const payload = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      secondsSpent: totalSeconds - secondsLeft,
      isLast,
    };
    onAnswer?.(payload);
    if (!isLast) dispatch(nextQuestion());
    setCurrentAnswer('');
  };

  if (!questions?.length) {
    return (
      <Card title="Interview">
        <Alert message="Upload resume, ensure name and email are set, then click Start Interview." type="info" />
      </Card>
    );
  }

  const stepItems = questions.map((q, i) => ({
    title: `Q${i + 1}`,
    status: i < currentQuestionIndex ? 'finish' : i === currentQuestionIndex ? 'process' : 'wait',
  }));

  return (
    <Card title={`Question ${currentQuestionIndex + 1} of ${questions.length}`}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Steps size="small" items={stepItems} current={currentQuestionIndex} />
        <Typography.Paragraph>{currentQuestion?.text}</Typography.Paragraph>
        <Timer totalSeconds={totalSeconds} secondsLeft={secondsLeft} />
        <Input.TextArea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here..."
          autoSize={{ minRows: 4, maxRows: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={() => handleSubmit(false)}>
            {isLast ? 'Submit & Finish' : 'Submit & Next'}
          </Button>
          <Button onClick={() => dispatch(nextQuestion())} disabled={isLast}>
            Skip
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default CandidateChat;
