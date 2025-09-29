import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Brain, User, Home } from "lucide-react";

const IntervieweeLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    </div>
  );
};

export default IntervieweeLayout;
