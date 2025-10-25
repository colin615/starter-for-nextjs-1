"use client";

import { useState, useEffect, useCallback } from "react";

export const useDashboardStats = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [activeUsersChartData, setActiveUsersChartData] = useState(null);
  const [usersList, setUsersList] = useState([]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const stats = await fetch(`/api/stats?start=${startISO}&end=${endISO}`);
      const data = await stats.json();

      if (data && typeof data.uniqueUsers === 'number') {
        setActiveUsers(data.uniqueUsers);
      }

      if (data && data.chartData && Array.isArray(data.chartData)) {
        setActiveUsersChartData(data.chartData);
      }

      if (data && data.result && Array.isArray(data.result)) {
        const processedData = data.result.map(item => {
          let wagered = 0;
          try {
            const dataArray = JSON.parse(item.raw);
            if (Array.isArray(dataArray)) {
              const wageredObj = dataArray.find(obj => obj.wagered !== undefined);
              if (wageredObj) {
                wagered = wageredObj.wagered || 0;
              }
            }
          } catch (e) {
            console.error("Error parsing data for item:", item.date, e);
          }

          return {
            date: item.date,
            wagered: wagered,
            displayDate: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          };
        });
        setStatsData(processedData);

        const usersMap = new Map();
        const latestDate = data.result.length > 0 ? data.result[data.result.length - 1].date : null;
        const todayUsersMap = new Map();
        
        if (latestDate) {
          const todayEntries = data.result.filter(item => item.date === latestDate);
          
          todayEntries.forEach((todayData) => {
            try {
              const todayArray = JSON.parse(todayData.raw);
              if (Array.isArray(todayArray)) {
                todayArray.forEach((userEntry) => {
                  if (userEntry.uid) {
                    const existing = todayUsersMap.get(userEntry.uid) || {
                      todayWagered: 0,
                      todayWeightedWagered: 0,
                      lastSeen: null,
                      activityScore: userEntry.activityScore || 0,
                      totalDaysActive: userEntry.totalDaysActive || 0
                    };
                    existing.todayWagered += userEntry.wagered || 0;
                    existing.todayWeightedWagered += userEntry.weightedWagered || 0;
                    if (userEntry.lastSeen) {
                      existing.lastSeen = userEntry.lastSeen;
                    }
                    todayUsersMap.set(userEntry.uid, existing);
                  }
                });
              }
            } catch (e) {
              console.error("Error parsing today's data:", e);
            }
          });
        }
        
        data.result.forEach((item) => {
          try {
            const dataArray = JSON.parse(item.raw);
            if (Array.isArray(dataArray)) {
              dataArray.forEach((userEntry) => {
                if (userEntry.uid) {
                  const existing = usersMap.get(userEntry.uid) || {
                    uid: userEntry.uid,
                    username: userEntry.username || userEntry.uid,
                    wagered: 0,
                    weightedWagered: 0,
                    todayWagered: 0,
                    todayWeightedWagered: 0,
                    service: item.identifier || null,
                    lastSeen: null,
                    activityScore: userEntry.activityScore || 0,
                    totalDaysActive: userEntry.totalDaysActive || 0,
                    rankLevel: userEntry.rankLevel || 0,
                    favoriteGameTitle: userEntry.favoriteGameTitle || null,
                    highestMultiplier: userEntry.highestMultiplier || null
                  };
                  
                  existing.wagered += userEntry.wagered || 0;
                  existing.weightedWagered += userEntry.weightedWagered || 0;
                  
                  if (!existing.service && item.identifier) {
                    existing.service = item.identifier;
                  }
                  
                  usersMap.set(userEntry.uid, existing);
                }
              });
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        });

        todayUsersMap.forEach((todayStats, uid) => {
          const user = usersMap.get(uid);
          if (user) {
            user.todayWagered = todayStats.todayWagered;
            user.todayWeightedWagered = todayStats.todayWeightedWagered;
            user.lastSeen = todayStats.lastSeen;
            // Use the most recent activity score and days active
            if (todayStats.activityScore > 0) {
              user.activityScore = todayStats.activityScore;
            }
            if (todayStats.totalDaysActive > 0) {
              user.totalDaysActive = todayStats.totalDaysActive;
            }
          }
        });

        const usersArray = Array.from(usersMap.values());
        setUsersList(usersArray);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate, fetchStats]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLoading,
    statsData,
    activeUsers,
    activeUsersChartData,
    usersList,
    fetchStats
  };
};
