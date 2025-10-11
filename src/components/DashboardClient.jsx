"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { CountryTimezoneModal } from "./CountryTimezoneModal";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUserSorting } from "@/hooks/useUserSorting";
import { useTimePeriod } from "@/hooks/useTimePeriod";
import { StatsCard } from "./dashboard/StatsCard";
import { WageredChart } from "./dashboard/WageredChart";
import { UserStatsTable } from "./dashboard/UserStatsTable";


export function DashboardClient({ user }) {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  
  // Use custom hooks
  const {
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
  } = useDashboardStats();

  const {
    sortField,
    sortDirection,
    handleSort,
    getSortedUsersList
  } = useUserSorting();

  const {
    selectedTimePeriod,
    handleTimePeriodChange
  } = useTimePeriod();

  // Check if user has timezone preference on component mount
  useEffect(() => {
    const checkUserTimezone = async () => {
      try {
        const response = await fetch("/api/user/timezone");
        const data = await response.json();
        
        // If no timezone preference is found, show the modal
        if (response.ok && !data.timezone) {
          setIsCountryModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to check user timezone:", error);
        // On error, show modal to ensure user can set timezone
        setIsCountryModalOpen(true);
      }
    };

    checkUserTimezone();
  }, []);

  const handleTimezoneSave = (timezone) => {
    setSelectedTimezone(timezone);
  };

  const onTimePeriodChange = (value) => {
    handleTimePeriodChange(value, setStartDate, setEndDate);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard activeUsers={activeUsers} isLoading={isLoading} />
        <WageredChart 
          wageredData={statsData}
          isLoading={isLoading}
          selectedTimePeriod={selectedTimePeriod}
          onTimePeriodChange={onTimePeriodChange}
        />
      </div>

      <UserStatsTable 
        usersList={usersList}
        isLoading={isLoading}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        getSortedUsersList={getSortedUsersList}
      />

      <div className="flex space-x-2 items-center">
        <div className="flex items-end">
          <Button onClick={fetchStats} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <CountryTimezoneModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSave={handleTimezoneSave}
      />
    </div>
  );
}
