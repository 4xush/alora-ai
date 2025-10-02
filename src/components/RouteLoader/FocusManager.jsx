import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * FocusManager - Manages focus for better accessibility when navigating between routes
 * Sets focus to the main content area when route changes to improve screen reader experience
 *
 * A key component of production-grade accessible applications
 */
const FocusManager = () => {
  const { pathname } = useLocation();
  const mainContentRef = useRef(null);

  useEffect(() => {
    // Find the main content area - use an existing landmark if available
    // or create a reference if not found
    let mainContent =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.getElementById("main-content");

    if (!mainContent) {
      // If no main content area exists, we'll create a ref to body
      mainContentRef.current = document.body;
      mainContent = mainContentRef.current;
    }

    // Set initial focus to main content for screen readers
    // but only if it doesn't have it already
    if (mainContent && !mainContent.contains(document.activeElement)) {
      // Set tabIndex temporarily to make it focusable
      const previousTabIndex = mainContent.getAttribute("tabindex");
      mainContent.setAttribute("tabindex", "-1");

      // Set focus
      mainContent.focus({ preventScroll: true });

      // Clean up - restore previous tabIndex or remove it
      if (previousTabIndex !== null) {
        mainContent.setAttribute("tabindex", previousTabIndex);
      } else {
        mainContent.removeAttribute("tabindex");
      }
    }
  }, [pathname]);

  return null;
};

export default FocusManager;
