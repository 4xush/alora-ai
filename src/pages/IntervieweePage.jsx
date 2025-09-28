import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { aiService } from "../services/aiService.js";
import {
  setProfile,
  setResume,
  startInterview,
  generateQuestions,
  recordAnswer,
  nextQuestion,
  scoreAnswers,
  completeInterview,
} from "../store/intervieweeSlice.js";
import { upsertCandidate } from "../store/interviewerSlice.js";
import InterviewFlow from "../components/InterviewFlow/InterviewFlow.jsx";

const IntervieweePage = () => {
  const dispatch = useDispatch();
  const interviewee = useSelector((s) => s.interviewee);
  const ui = useSelector((s) => s.ui);
  const [error, setError] = useState("");

  const progress = useMemo(() => {
    const total = interviewee.questions.length || 6;
    const done = interviewee.answers.length;
    return Math.round((done / total) * 100);
  }, [interviewee.questions, interviewee.answers]);

  useEffect(() => {
    // When interview completes, update interviewer view
    if (interviewee.status === "completed") {
      const transcript = interviewee.questions.map((q, i) => ({
        q: q.text,
        a: interviewee.answers[i]?.answer || "",
        score: interviewee.answers[i]?.score ?? null,
        explanation: interviewee.answers[i]?.explanation || "",
      }));
      const id =
        interviewee.profile.email ||
        interviewee.profile.name ||
        Math.random().toString(36).slice(2);
      dispatch(
        upsertCandidate({
          id,
          name: interviewee.profile.name,
          email: interviewee.profile.email,
          phone: interviewee.profile.phone,
          score: interviewee.finalScore,
          status: "Completed",
          summary: interviewee.finalSummary,
          resumeText: interviewee.resume.text,
          transcript,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewee.status]);

  const onResumeParsed = async (text, fileMeta) => {
    setError("");
    console.log("Resume parsed, text length:", text.length);
    dispatch(setResume({ text, ...fileMeta }));

    try {
      console.log("Extracting resume info...");
      const info = await aiService.extractResumeInfo({ resumeText: text });
      console.log("Extracted profile info:", info);
      dispatch(setProfile(info));
    } catch (error) {
      console.error("Error extracting resume info:", error);
      // Use default profile info as a fallback
      dispatch(
        setProfile({
          name: "Candidate",
          email: "candidate@example.com",
          phone: "555-123-4567",
        })
      );
    }
  };

  const canStart = interviewee.profile.email && interviewee.profile.name;

  const beginInterview = async () => {
    if (!canStart) {
      setError("Please ensure your name and email are present.");
      return;
    }
    dispatch(startInterview());
    await dispatch(generateQuestions());
    const id =
      interviewee.profile.email ||
      interviewee.profile.name ||
      Math.random().toString(36).slice(2);
    dispatch(
      upsertCandidate({
        id,
        name: interviewee.profile.name,
        email: interviewee.profile.email,
        phone: interviewee.profile.phone,
        score: null,
        status: "In Progress",
        summary: "",
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
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <InterviewFlow
        onStart={beginInterview}
        onAnswer={onAnswer}
        onComplete={() => {}}
        onResumeParsed={onResumeParsed}
        error={error}
      />
    </div>
  );
};

export default IntervieweePage;
