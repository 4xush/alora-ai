import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { uiActions } from "../../store/uiSlice";

/**
 * RouteLoader - A component that handles route transition loading states
 * Shows a loading indicator during route changes and updates global loading state
 *
 * Features:
 * - Debounced loading state to avoid flashes for very quick transitions
 * - Smart timeout handling to ensure consistent UX
 * - Detects DOM content loaded state for accurate loading completion
 * - Minimum loading time to prevent flickering
 */
const RouteLoader = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [loadingTimerId, setLoadingTimerId] = useState(null);
  const lastPathRef = useRef(location.pathname);
  const loadStartTimeRef = useRef(0);
  const minLoadingTime = 300; // Minimum time to show loading in ms

  // Helper to calculate remaining time to ensure minimum loading display
  const getRemainingLoadTime = () => {
    const elapsed = Date.now() - loadStartTimeRef.current;
    return Math.max(0, minLoadingTime - elapsed);
  };

  // Update loading state on route change with intelligent timing
  useEffect(() => {
    // Skip effect on initial render
    if (
      lastPathRef.current === location.pathname &&
      loadStartTimeRef.current === 0
    ) {
      return;
    }

    // Update last path
    lastPathRef.current = location.pathname;

    // Clear any existing timer to avoid race conditions
    if (loadingTimerId) clearTimeout(loadingTimerId);

    // Set the loading start time
    loadStartTimeRef.current = Date.now();

    // Show loading indicator immediately for better UX
    dispatch(uiActions.setLoading(true));

    // Check for content load completion
    const checkContentLoaded = () => {
      // Wait for minimum loading time to avoid flicker
      const remainingTime = getRemainingLoadTime();

      setTimeout(() => {
        // Hide loading state
        dispatch(uiActions.setLoading(false));
      }, remainingTime);
    };

    // Set a maximum loading time to ensure it doesn't get stuck
    const hideLoadingTimer = setTimeout(() => {
      dispatch(uiActions.setLoading(false));
    }, 2000); // Max loading time as fallback

    setLoadingTimerId(hideLoadingTimer);

    // Add listener for page content loaded
    window.addEventListener("load", checkContentLoaded);

    // Use MutationObserver as another signal that content has loaded
    const observer = new MutationObserver(() => {
      // After some DOM changes, check if we can consider the page loaded
      setTimeout(checkContentLoaded, 100);
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup function
    return () => {
      window.removeEventListener("load", checkContentLoaded);
      observer.disconnect();
      if (loadingTimerId) clearTimeout(loadingTimerId);
    };
  }, [location.pathname, dispatch]);

  // Hide loading when component unmounts
  useEffect(() => {
    return () => {
      dispatch(uiActions.setLoading(false));
      if (loadingTimerId) clearTimeout(loadingTimerId);
    };
  }, [dispatch, loadingTimerId]);

  return children;
};

export default RouteLoader;
