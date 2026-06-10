"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_PREFIX = "exam_timer_";

export function useTimer(examId: string, initialMinutes: number) {
  const storageKey = `${STORAGE_PREFIX}${examId}`;

  const getInitialSeconds = (): number => {
    if (typeof window === "undefined") return initialMinutes * 60;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return initialMinutes * 60;
  };

  const [seconds, setSeconds] = useState(getInitialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveToStorage = useCallback(
    (val: number) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(val));
      }
    },
    [storageKey]
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        const next = prev - 1;
        saveToStorage(next);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [saveToStorage]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    setSeconds(initialMinutes * 60);
  }, [initialMinutes, storageKey]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isLow = seconds > 0 && seconds < 300;
  const isExpired = seconds <= 0;

  return { seconds, display, isLow, isExpired, clearTimer };
}
