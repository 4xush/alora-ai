import { useEffect, useRef, useState } from 'react';

export function useInterviewTimer(initialSeconds, onExpire, paused) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  const reset = (secs) => {
    clearInterval(intervalRef.current);
    setSecondsLeft(secs);
  };

  return { secondsLeft, reset };
}
