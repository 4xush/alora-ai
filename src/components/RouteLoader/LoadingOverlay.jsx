import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { useSelector } from "react-redux";

/**
 * LoadingOverlay - A global loading overlay component
 * Shows a full-screen loading animation when global loading state is true
 * with smooth fade-in/out transitions and a modern, subtle design
 */
const LoadingOverlay = () => {
  const { loading } = useSelector((state) => state.ui);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      // Add delay before removing from DOM to allow for fade-out animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible && !loading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/70 to-slate-50/70 backdrop-blur-sm transition-all duration-300"
      style={{
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? "auto" : "none",
      }}
    >
      <div className="bg-white/90 p-7 rounded-2xl shadow-xl border border-indigo-100 animate-pulse">
        <div className="flex flex-col items-center">
          <Spin size="large" className="scale-125 mb-2" />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
