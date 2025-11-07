"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Filter, Calendar, Download } from "lucide-react";
import { CasinoFilterDropdown } from "./dashboard/CasinoFilterDropdown";
import { useTimePeriod } from "@/hooks/useTimePeriod";
import { useConnectedSites } from "@/hooks/useConnectedSites";
import { supabase } from "@/lib/supabase";

const FETCH_WAGERS_URL =
  "https://kzrswdfrzmrdqsnsrksh.supabase.co/functions/v1/fetch-wagers";

const getJWT = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const getDateRangeForPeriod = (timePeriod) => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  switch (timePeriod) {
    case "1d":
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "1w":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "2w":
      startDate.setDate(endDate.getDate() - 14);
      break;
    case "30d":
      startDate.setDate(endDate.getDate() - 30);
      break;
    default:
      startDate.setHours(endDate.getHours() - 12);
  }

  return { startDate, endDate };
};

export function DashboardClient({ user }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCasinos, setSelectedCasinos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedTimePeriod, handleTimePeriodChange } = useTimePeriod();
  const { linkedServices } = useConnectedSites();

  const hasActiveFilters = selectedCasinos.length > 0;
  const welcomeMessage = user?.name
    ? `Welcome back, ${user.name.split(" ")[0]}`
    : "Welcome back";

  const handleFetchWagers = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const jwt = await getJWT();
      const { startDate, endDate } = getDateRangeForPeriod(selectedTimePeriod);

      const response = await fetch(FETCH_WAGERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          jwt,
          casino_identifier: selectedCasinos[0] ?? "roobet",
        }),
      });

      const data = await response.json();
      console.log("fetch-wagers response:", data);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to fetch wagers");
      }
    } catch (error) {
      console.error("Error calling fetch-wagers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCasinos, selectedTimePeriod, user?.id]);

  useEffect(() => {
    if (user?.id) {
      handleFetchWagers();
    }
  }, [handleFetchWagers, user?.id]);

  const handleCasinoFilter = (casinos) => {
    setSelectedCasinos(casinos);
  };

  const handleClearFilters = () => {
    setSelectedCasinos([]);
  };

  const onTimePeriodChange = (value) => {
    handleTimePeriodChange(value);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">{welcomeMessage}</h1>
          <p className="text-muted-foreground mt-1.5">
            Adjust the filters to refine your wager data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`h-9 transition-all duration-200 ${
                hasActiveFilters
                  ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
                  : "hover:border-border/60"
              } ${isFilterOpen ? "bg-muted/30" : ""}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-2 text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {selectedCasinos.length}
                </Badge>
              )}
            </Button>

            <CasinoFilterDropdown
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              linkedServices={linkedServices}
              selectedCasinos={selectedCasinos}
              onCasinoSelect={handleCasinoFilter}
              onClearFilters={handleClearFilters}
            />
          </div>

          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="h-4 w-4" />
          </Button>

          <Select value={selectedTimePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="1w">Last 7 days</SelectItem>
              <SelectItem value="2w">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={isLoading}
            onClick={handleFetchWagers}
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Loading..." : "Fetch Wagers"}
          </Button>
        </div>
      </div>
    </div>
  );
}

