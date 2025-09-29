import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import IntervieweeLayout from "./layouts/IntervieweeLayout.jsx";
import InterviewerLayout from "./layouts/InterviewerLayout.jsx";
import IntervieweePage from "./pages/IntervieweePage.jsx";
import InterviewerPage from "./pages/InterviewerPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<IntervieweeLayout />}>
        <Route path="/interviewee" element={<IntervieweePage />} />
      </Route>
      <Route element={<InterviewerLayout />}>
        <Route path="/interviewer" element={<InterviewerPage />} />
      </Route>
    </Routes>
  );
};

export default App;
