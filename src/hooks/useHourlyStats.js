import { useState, useEffect } from "react";

export const useDailyStats = (period = "1w") => {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyData, setDailyData] = useState(null);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalWeighted, setTotalWeighted] = useState(0);

  const fetchDailyStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stats/hourly?period=${period}`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily stats");
      }
      const data = await response.json();
      
      setDailyData(data.chartData);
      setTotalWagered(data.totalWagered);
      setTotalWeighted(data.totalWeighted);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      setDailyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStats();
    
 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return {
    isLoading,
    dailyData,
    totalWagered,
    totalWeighted,
    refetch: fetchDailyStats,
  };
};

