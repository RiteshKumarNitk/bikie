"use client";

import { useEffect, useRef, useState } from "react";

/** Ticking countdown for OTP resend buttons. Call `start()` after each successful send. */
export function useResendCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return { remaining, start, canResend: remaining === 0 };
}
