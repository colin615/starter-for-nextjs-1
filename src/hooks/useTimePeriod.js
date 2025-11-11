"use client";

import { useCallback, useState } from "react";

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date) => {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  result.setDate(result.getDate() - diff);
  return result;
};

const startOfMonth = (date) => {
  const result = startOfDay(date);
  result.setDate(1);
  return result;
};

const getRangeForPeriod = (period) => {
  const now = new Date();
  let start = startOfDay(now);
  let end = new Date(now);

  switch (period) {
    case "today":
      start = startOfDay(now);
      end = now;
      break;
    case "yesterday": {
      const yesterday = startOfDay(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = yesterday;
      end = endOfDay(yesterday);
      break;
    }
    case "last24h":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      end = now;
      break;
    case "last7d":
      start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      end = now;
      break;
    case "last30d":
      start = startOfDay(now);
      start.setDate(start.getDate() - 29);
      end = now;
      break;
    case "weekToDate":
      start = startOfWeek(now);
      end = now;
      break;
    case "monthToDate":
      start = startOfMonth(now);
      end = now;
      break;
    default:
      start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      end = now;
  }

  return { start, end };
};

export const useTimePeriod = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("last7d");

  const setDateRangeFromPeriod = useCallback((period, setStartDate, setEndDate) => {
    const { start, end } = getRangeForPeriod(period);

    if (typeof setStartDate === "function") {
      setStartDate(start.toISOString().split("T")[0]);
    }

    if (typeof setEndDate === "function") {
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, []);

  const handleTimePeriodChange = useCallback(
    (value, setStartDate, setEndDate) => {
      setSelectedTimePeriod(value);
      setDateRangeFromPeriod(value, setStartDate, setEndDate);
    },
    [setDateRangeFromPeriod]
  );

  return {
    selectedTimePeriod,
    handleTimePeriodChange,
    setDateRangeFromPeriod,
  };
};
