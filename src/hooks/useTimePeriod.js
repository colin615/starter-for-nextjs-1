"use client";

import { useState } from "react";

export const useTimePeriod = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30d");

  const setDateRangeFromPeriod = (period, setStartDate, setEndDate) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case "1d":
        start.setDate(end.getDate() - 1);
        break;
      case "1w":
        start.setDate(end.getDate() - 7);
        break;
      case "2w":
        start.setDate(end.getDate() - 14);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleTimePeriodChange = (value, setStartDate, setEndDate) => {
    setSelectedTimePeriod(value);
    setDateRangeFromPeriod(value, setStartDate, setEndDate);
  };

  return {
    selectedTimePeriod,
    handleTimePeriodChange,
    setDateRangeFromPeriod
  };
};
