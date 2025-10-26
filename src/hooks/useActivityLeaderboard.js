"use client";

import { useState, useEffect, useCallback } from "react";

export const useActivityLeaderboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState("day");
  const [limit, setLimit] = useState(100);
  const [minActivityScore, setMinActivityScore] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        period,
        limit: limit.toString(),
        minActivityScore: minActivityScore.toString()
      });

      const response = await fetch(`/api/leaderboard/activity?${params}`);
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data.leaderboard);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Error fetching activity leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, limit, minActivityScore]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    isLoading,
    leaderboard,
    period,
    setPeriod,
    limit,
    setLimit,
    minActivityScore,
    setMinActivityScore,
    fetchLeaderboard
  };
};
