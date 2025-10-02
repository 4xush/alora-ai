import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import AppLayout from "./layouts/AppLayout.jsx";
// Lazy load page components only
const LandingPage = React.lazy(() => import("./pages/LandingPage.jsx"));
const IntervieweePage = React.lazy(() =>
  import("./pages/Interviewee/IntervieweePage")
);
const InterviewerPage = React.lazy(() => import("./pages/InterviewerPage.jsx"));

const App = () => {
  return (
    <Routes>
      {/* Public routes - no suspense loading, let page handle its own loading */}
      <Route
        path="/"
        element={
            <RouteTransition>
              <LandingPage />
            </RouteTransition>
        }
      />
      <Route element={<AppLayout />}>
        {/* Interviewee routes */}
        <Route
          path="/interviewee"
          element={<Navigate to="/interviewee/dashboard" />}
        />
        <Route
          path="/interviewee/dashboard"
          element={
            <RouteTransition>
              <IntervieweePage step="dashboard" />
            </RouteTransition>
          }
        />
        <Route
          path="/interviewee/pre-interview"
          element={
            <RouteTransition>
              <IntervieweePage step="pre-interview" />
            </RouteTransition>
          }
        />
        <Route
          path="/interviewee/interview"
          element={
            <RouteTransition>
              <IntervieweePage step="interview" />
            </RouteTransition>
          }
        />
        <Route
          path="/interviewee/summary"
          element={
            <RouteTransition>
              <IntervieweePage step="summary" />
            </RouteTransition>
          }
        />

        {/* Interviewer routes */}
        <Route
          path="/interviewer"
          element={
            <RouteTransition>
              <InterviewerPage />
            </RouteTransition>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
