import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import IntervieweeLayout from "./layouts/IntervieweeLayout.jsx";
import InterviewerLayout from "./layouts/InterviewerLayout.jsx";
import IntervieweePage from "./pages/Interviewee/IntervieweePage";
import InterviewerPage from "./pages/InterviewerPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Interviewee routes */}
      <Route element={<IntervieweeLayout />}>
        {/* Dashboard */}
        <Route
          path="/interviewee"
          element={<Navigate to="/interviewee/dashboard" />}
        />
        <Route
          path="/interviewee/dashboard"
          element={<IntervieweePage step="dashboard" />}
        />

        {/* Interview Flow */}
        <Route
          path="/interviewee/pre-interview"
          element={<IntervieweePage step="pre-interview" />}
        />
        <Route
          path="/interviewee/interview"
          element={<IntervieweePage step="interview" />}
        />

        {/* Summary */}
        <Route
          path="/interviewee/summary"
          element={<IntervieweePage step="summary" />}
        />

        {/* Settings */}
        <Route
          path="/interviewee/settings"
          element={<SettingsPage userType="interviewee" />}
        />
      </Route>

      {/* Interviewer routes */}
      <Route element={<InterviewerLayout />}>
        <Route path="/interviewer" element={<InterviewerPage />} />
        <Route
          path="/interviewer/settings"
          element={<SettingsPage userType="interviewer" />}
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
