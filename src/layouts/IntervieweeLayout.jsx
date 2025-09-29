import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { uiActions } from "../store/uiSlice.js";
import { resumeInterview, resetInterview } from "../store/intervieweeSlice.js";
import { Brain, User, Home, RotateCcw, Play } from "lucide-react";

const IntervieweeLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showWelcomeBack } = useSelector((s) => s.ui);
  const { inProgress } = useSelector((s) => s.interviewee);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (inProgress) {
      dispatch(uiActions.setShowWelcomeBack(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = () => {
    dispatch(resumeInterview());
    dispatch(uiActions.setShowWelcomeBack(false));
  };

  const handleStartOver = () => {
    dispatch(resetInterview());
    dispatch(uiActions.setShowWelcomeBack(false));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
                AI Interview Assistant
              </span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <div className="group">
                <button
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 text-slate-700 hover:text-slate-800 text-sm"
                  onClick={toggleMenu}
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">Interviewee</span>
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 transition-all duration-200 transform ${
                    isMenuOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible translate-y-1"
                  }`}
                >
                  <div className="py-1">
                    <button
                      className="flex items-center space-x-2 w-full px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors duration-200"
                      onClick={() => navigate("/")}
                    >
                      <Home className="w-3 h-3" />
                      <span>Back to Home</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Welcome Back Modal */}
      {showWelcomeBack && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Welcome Back!
              </h3>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6 leading-relaxed">
                You have an interview in progress. Would you like to continue
                where you left off or start fresh?
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume Interview
                </button>

                <button
                  onClick={handleStartOver}
                  className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 hover:text-slate-800 transition-all duration-200 transform hover:scale-105 flex items-center justify-center border border-slate-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntervieweeLayout;
