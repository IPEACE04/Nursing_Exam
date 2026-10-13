"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_PREFIX = "exam_timer_";

export function getTimerInitialSeconds(initialMinutes: number | null, storedSeconds: string | null) {
  if (!Number.isFinite(initialMinutes) || !initialMinutes || initialMinutes <= 0) {
    return 0;
  }

  const timeLimitSeconds = Math.floor(initialMinutes * 60);
  const parsed = storedSeconds ? parseInt(storedSeconds, 10) : NaN;
  if (!isNaN(parsed) && parsed > 0) {
    return Math.min(parsed, timeLimitSeconds);
  }

  return timeLimitSeconds;
}

export function useTimer(examId: string, initialMinutes: number | null) {
  const storageKey = `${STORAGE_PREFIX}${examId}`;
  const timerKey = initialMinutes && initialMinutes > 0 ? `${examId}:${initialMinutes}` : null;

  const getInitialSeconds = useCallback((): number => {
    const stored = typeof window === "undefined" ? null : localStorage.getItem(storageKey);
    return getTimerInitialSeconds(initialMinutes, stored);
  }, [initialMinutes, storageKey]);

  const [timerState, setTimerState] = useState(() => ({
    key: timerKey,
    seconds: getInitialSeconds(),
  }));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seconds = timerKey && timerState.key === timerKey
    ? timerState.seconds
    : timerKey ? getInitialSeconds() : 0;

  const saveToStorage = useCallback(
    (val: number) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(val));
      }
    },
    [storageKey]
  );

  useEffect(() => {
    if (!timerKey) return;

    intervalRef.current = setInterval(() => {
      setTimerState((previous) => {
        const current = previous.key === timerKey ? previous.seconds : getInitialSeconds();
        if (current <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return { key: timerKey, seconds: 0 };
        }
        const next = current - 1;
        saveToStorage(next);
        return { key: timerKey, seconds: next };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [getInitialSeconds, saveToStorage, timerKey]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    setTimerState({
      key: timerKey,
      seconds: getTimerInitialSeconds(initialMinutes, null),
    });
  }, [initialMinutes, storageKey, timerKey]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isLow = seconds > 0 && seconds < 300;
  const isExpired = seconds <= 0;

  return { seconds, display, isLow, isExpired, clearTimer };
}
