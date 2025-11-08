import { useEffect } from 'react';

/**
 * Hook to scroll to top of page when component mounts
 * @param behavior - 'smooth' for smooth scroll, 'auto' for instant scroll
 */
export function useScrollToTop(behavior: ScrollBehavior = 'smooth') {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior });
  }, [behavior]);
}

/**
 * Function to scroll to top programmatically
 * @param behavior - 'smooth' for smooth scroll, 'auto' for instant scroll
 */
export function scrollToTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({ top: 0, behavior });
}

