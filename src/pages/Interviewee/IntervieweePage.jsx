import React from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import DashboardPage from "./DashboardPage";
import PreInterviewPage from "./PreInterviewPage";
import InterviewSessionPage from "./InterviewSessionPage";
import SummaryPage from "./SummaryPage";
import SettingsPage from "./SettingsPage"; // NEW: Import settings page
import ErrorBoundary from "../../components/ErrorBoundary/ErrorBoundary";
import useInterviewNavigation from "../../hooks/interviewee/useInterviewNavigation";
import useInterviewPersistence from "../../hooks/interviewee/useInterviewPersistence";

/**
 * IntervieweePage acts as a router that renders the appropriate subpage based on the step
 * This component is now much simpler and only responsible for routing
 */
const IntervieweePage = ({ step = "dashboard" }) => {
  // Use the navigation hook for route validation
  useInterviewNavigation(step);

  // Use persistence hook for saving/resuming interview state
  useInterviewPersistence();

  // Get loading state from Redux
  const { loading } = useSelector((s) => s.interviewee);

  // Render the appropriate page based on step
  const renderPageForStep = () => {
    switch (step) {
      case "dashboard":
        return <DashboardPage />;
      case "pre-interview":
        return <PreInterviewPage />;
      case "interview":
        return <InterviewSessionPage />;
      case "summary":
        return <SummaryPage />;
      case "settings": // NEW: Handle settings step
        return <SettingsPage />;
      default:
        console.warn(`Unknown step: ${step}, falling back to dashboard`);
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto">
        <ErrorBoundary onReset={() => window.location.reload()}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {renderPageForStep()}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

IntervieweePage.propTypes = {
  step: PropTypes.oneOf([
    "dashboard",
    "pre-interview",
    "interview",
    "summary",
    "settings",
  ]), // NEW: Added settings
};

export default IntervieweePage;
