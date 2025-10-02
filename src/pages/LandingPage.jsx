const handleNavigate = (path) => {
  // Replace with your actual navigation logic
  console.log(`Navigating to ${path}`);
  // navigate(path);
};
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Brain,
  Users,
  FileText,
  BarChart3,
  Clock,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleNavigate = (path) => {
    // Replace with your actual navigation logic
    console.log(`Navigating to ${path}`);
    // navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <nav className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-md font-bold text-slate-800">
            AI Interview Assistant
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-5 max-w-6xl">
        {/* Hero Section */}
        <div
          className={`text-center mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="text-4xl md:text-4xl font-bold text-slate-800 mb-2 leading-tight">
            AI-Powered Interview
            <span className="block text-indigo-600">Platform</span>
          </h1>

          <p className="text-lg text-slate-600 mb-5 max-w-xl mx-auto leading-relaxed">
            Your personal AI-powered assistant to take interviews seamlessly.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-7 max-w-3xl mx-auto mb-14">
          {/* Interviewee Card */}
          <div
            className="group bg-white rounded-xl p-6 shadow hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-indigo-200 transform hover:-translate-y-1"
            onClick={() => navigate("/interviewee")}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">
              For Interviewees
            </h3>
            <p className="text-slate-600 mb-5 text-sm leading-relaxed">
              Take a timed, AI-generated interview tailored to your resume and
              desired role. Get instant feedback.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="flex items-center text-slate-600">
                <FileText className="w-4 h-4 text-indigo-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">
                  Resume-based personalized questions
                </span>
              </div>
              <div className="flex items-center text-slate-600">
                <Clock className="w-4 h-4 text-indigo-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">Timed MCQ assessments</span>
              </div>
              <div className="flex items-center text-slate-600">
                <BarChart3 className="w-4 h-4 text-indigo-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">Instant scoring and feedback</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-5 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
              Start Interview
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Interviewer Card */}
          <div
            className="group bg-white rounded-xl p-6 shadow hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-indigo-200 transform hover:-translate-y-1"
            onClick={() => navigate("/interviewer")}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-3">
              For Interviewers
            </h3>
            <p className="text-slate-600 mb-5 text-sm leading-relaxed">
              Review candidate performance, scores, and AI-generated summaries
              for informed hiring.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="flex items-center text-slate-600">
                <Users className="w-4 h-4 text-purple-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">
                  Comprehensive candidate management
                </span>
              </div>
              <div className="flex items-center text-slate-600">
                <BarChart3 className="w-4 h-4 text-purple-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">Detailed analytics dashboard</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Shield className="w-4 h-4 text-purple-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm">Multiple attempt tracking</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
              View Dashboard
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Key Features */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-12">
            Why Choose Our Platform?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">AI-Powered</h3>
              <p className="text-sm text-slate-600">
                Advanced AI analyzes resumes and generates personalized
                questions
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Real-time</h3>
              <p className="text-sm text-slate-600">
                Instant feedback and scoring with comprehensive analytics
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Reliable</h3>
              <p className="text-sm text-slate-600">
                Secure platform with data persistence and progress tracking
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              AI Interview Assistant
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            Streamlining technical interviews with AI-powered personalization
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
