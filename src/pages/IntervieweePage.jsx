import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Space, Button, Progress, Input, Alert, Row, Col } from 'antd';
import ResumeUploader from '../components/ResumeUploader/ResumeUploader.jsx';
import CandidateChat from '../components/CandidateChat/CandidateChat.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { aiService } from '../services/aiService.js';
import { setProfile, setResume, startInterview, generateQuestions, recordAnswer, nextQuestion, scoreAnswers, completeInterview, pauseInterview, resumeInterview } from '../store/intervieweeSlice.js';
import { upsertCandidate } from '../store/interviewerSlice.js';

const IntervieweePage = () => {
  const dispatch = useDispatch();
  const interviewee = useSelector((s) => s.interviewee);
  const ui = useSelector((s) => s.ui);
  const [error, setError] = useState('');

  const progress = useMemo(() => {
    const total = interviewee.questions.length || 6;
    const done = interviewee.answers.length;
    return Math.round((done / total) * 100);
  }, [interviewee.questions, interviewee.answers]);

  useEffect(() => {
    // When interview completes, update interviewer view
    if (interviewee.status === 'completed') {
      const transcript = interviewee.questions.map((q, i) => ({ q: q.text, a: interviewee.answers[i]?.answer || '', score: interviewee.answers[i]?.score ?? null, explanation: interviewee.answers[i]?.explanation || '' }));
      const id = interviewee.profile.email || interviewee.profile.name || Math.random().toString(36).slice(2);
      dispatch(
        upsertCandidate({
          id,
          name: interviewee.profile.name,
          email: interviewee.profile.email,
          phone: interviewee.profile.phone,
          score: interviewee.finalScore,
          status: 'Completed',
          summary: interviewee.finalSummary,
          resumeText: interviewee.resume.text,
          transcript,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewee.status]);

  const onResumeParsed = async (text, fileMeta) => {
    setError('');
    dispatch(setResume({ text, ...fileMeta }));
    const info = await aiService.extractResumeInfo({ resumeText: text });
    dispatch(setProfile(info));
  };

  const canStart = interviewee.profile.email && interviewee.profile.name;

  const beginInterview = async () => {
    if (!canStart) {
      setError('Please ensure your name and email are present.');
      return;
    }
    dispatch(startInterview());
    await dispatch(generateQuestions());
    const id = interviewee.profile.email || interviewee.profile.name || Math.random().toString(36).slice(2);
    dispatch(
      upsertCandidate({
        id,
        name: interviewee.profile.name,
        email: interviewee.profile.email,
        phone: interviewee.profile.phone,
        score: null,
        status: 'In Progress',
        summary: '',
        resumeText: interviewee.resume.text,
        transcript: [],
      })
    );
  };

  const onAnswer = async ({ questionId, answer, secondsSpent, isLast }) => {
    dispatch(recordAnswer({ questionId, answer, secondsSpent }));
    if (!isLast) dispatch(nextQuestion());
    if (isLast) {
      const res = await dispatch(scoreAnswers());
      dispatch(completeInterview(res.payload));
    }
  };

  const togglePause = () => {
    if (!interviewee.inProgress) return;
    if (interviewee.paused) dispatch(resumeInterview());
    else dispatch(pauseInterview());
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="Upload Resume" bordered>
          <Space direction="vertical" style={{ width: '100%' }}>
            <ResumeUploader onParsed={onResumeParsed} />
            <Input
              placeholder="Name"
              value={interviewee.profile.name}
              onChange={(e) => dispatch(setProfile({ name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={interviewee.profile.email}
              onChange={(e) => dispatch(setProfile({ email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={interviewee.profile.phone}
              onChange={(e) => dispatch(setProfile({ phone: e.target.value }))}
            />
            {error && <Alert type="error" message={error} />} 
            <Button type="primary" onClick={beginInterview} disabled={!canStart}>
              Start Interview
            </Button>
            {interviewee.inProgress && (
              <Button onClick={togglePause}>
                {interviewee.paused ? 'Resume' : 'Pause'}
              </Button>
            )}
            <Progress percent={progress} />
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <CandidateChat onAnswer={onAnswer} />
      </Col>
    </Row>
  );
};

export default IntervieweePage;
