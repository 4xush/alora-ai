import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollToTop - A production-grade scroll restoration component
 *
 * Features:
 * - Scrolls to top on normal navigation
 * - Preserves scroll position when using browser back/forward buttons
 * - Handles hash links properly (#section)
 * - Smooth scroll for better user experience
 * - Works with SPAs and traditional websites
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType(); // "POP", "PUSH", or "REPLACE"
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    // Skip on initial render
    if (lastPathRef.current === pathname && hash === "") return;

    // Update ref
    lastPathRef.current = pathname;

    // Handle hash links (like #section) - scroll to element instead of top
    if (hash) {
      // Small timeout to ensure the DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
      return;
    }

    // If it's a browser back/forward navigation (POP), let browser handle the scroll
    if (navigationType === "POP") {
      return;
    }

    // For normal navigation (PUSH or REPLACE), scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" for immediate scroll without animation
    });

    // For compatibility with older browsers
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // For Safari

    // Reset focus for accessibility
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [pathname, hash, navigationType]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
