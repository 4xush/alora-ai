import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import IntervieweePage from "./pages/Interviewee/IntervieweePage";
import InterviewerPage from "./pages/InterviewerPage.jsx";
import { RouteLoader, LoadingOverlay } from "./components/RouteLoader";

const App = () => {
  return (
    <RouteLoader>
      <LoadingOverlay />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* All routes under unified AppLayout */}
        <Route element={<AppLayout />}>
          {/* Interviewee routes */}
          <Route
            path="/interviewee"
            element={<Navigate to="/interviewee/dashboard" />}
          />
          <Route
            path="/interviewee/dashboard"
            element={<IntervieweePage step="dashboard" />}
          />
          <Route
            path="/interviewee/pre-interview"
            element={<IntervieweePage step="pre-interview" />}
          />
          <Route
            path="/interviewee/interview"
            element={<IntervieweePage step="interview" />}
          />
          <Route
            path="/interviewee/summary"
            element={<IntervieweePage step="summary" />}
          />
          {/* NEW: Settings route */}
          <Route
            path="/interviewee/settings"
            element={<IntervieweePage step="settings" />}
          />

          {/* Interviewer routes */}
          <Route path="/interviewer" element={<InterviewerPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteLoader>
  );
};

export default App;
