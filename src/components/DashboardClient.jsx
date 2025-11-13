"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RefreshCcw } from "lucide-react";
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

const TIMEFRAME_OPTIONS = [
  {
    value: "today",
    label: "Today",
    allowedGranularities: ["hour"],
    getRange: () => {
      const endDate = new Date();
      const startDate = startOfDay(endDate);
      return { startDate, endDate };
    },
  },
  {
    value: "yesterday",
    label: "Yesterday",
    allowedGranularities: ["hour"],
    getRange: () => {
      const today = new Date();
      const startDate = startOfDay(today);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = endOfDay(startDate);
      return { startDate, endDate };
    },
  },
  {
    value: "last24h",
    label: "Last 24 hours",
    allowedGranularities: ["hour"],
    getRange: () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      return { startDate, endDate };
    },
  },
  {
    value: "last7d",
    label: "Last 7 days",
    allowedGranularities: ["day"],
    getRange: () => {
      const endDate = new Date();
      const startDate = startOfDay(endDate);
      startDate.setDate(startDate.getDate() - 6);
      return { startDate, endDate };
    },
  },
  {
    value: "last30d",
    label: "Last 30 days",
    allowedGranularities: ["day"],
    getRange: () => {
      const endDate = new Date();
      const startDate = startOfDay(endDate);
      startDate.setDate(startDate.getDate() - 29);
      return { startDate, endDate };
    },
  },
  {
    value: "weekToDate",
    label: "Week to date",
    allowedGranularities: ["day"],
    getRange: () => {
      const endDate = new Date();
      const startDate = startOfWeek(endDate);
      return { startDate, endDate };
    },
  },
  {
    value: "monthToDate",
    label: "Month to date",
    allowedGranularities: ["day"],
    getRange: () => {
      const endDate = new Date();
      const startDate = startOfMonth(endDate);
      return { startDate, endDate };
    },
  },
];

const getTimeframeDetails = (timePeriod) => {
  const fallbackOption = TIMEFRAME_OPTIONS[0];
  const option =
    TIMEFRAME_OPTIONS.find((candidate) => candidate.value === timePeriod) ??
    fallbackOption;
  const { startDate, endDate } = option.getRange();
  const durationHours = Math.max(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
    0
  );

  let allowedGranularities = [...option.allowedGranularities];

  if (
    allowedGranularities.includes("day") &&
    durationHours <= 24 // fewer than two distinct daily buckets
  ) {
    allowedGranularities = allowedGranularities.filter(
      (granularity) => granularity !== "day"
    );
  }

  if (allowedGranularities.length === 0) {
    allowedGranularities = ["hour"];
  }

  return { startDate, endDate, allowedGranularities };
};

const formatCasinoName = (identifier = "") => {
  return identifier
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export function DashboardClient({ user }) {
  const GLOBAL_STORAGE_KEY = "dashboardFilters";
  const storageKey = user?.id
    ? `${GLOBAL_STORAGE_KEY}:${user.id}`
    : GLOBAL_STORAGE_KEY;

  const getStoredFilters = useCallback(() => {
    if (typeof window === "undefined") return null;

    const readKey = (key) => {
      if (!key) return null;
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        console.warn(`Failed to parse dashboard filters from ${key}`, error);
        return null;
      }
    };

    const primary = readKey(storageKey);
    if (primary) return primary;

    if (storageKey !== GLOBAL_STORAGE_KEY) {
      return readKey(GLOBAL_STORAGE_KEY);
    }

    return null;
  }, [GLOBAL_STORAGE_KEY, storageKey]);

  const storedFiltersRef = useRef(null);
  const hasHydratedFiltersRef = useRef(false);

  const [selectedTimePeriod, setSelectedTimePeriod] = useState(() => {
    if (typeof window === "undefined") return "last7d";
    const stored = getStoredFilters();
    storedFiltersRef.current = stored ?? {};
    const savedTimeframe = stored?.timeframe;
    return TIMEFRAME_OPTIONS.some(
      (option) => option.value === savedTimeframe
    )
      ? savedTimeframe
      : "last7d";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [granularity, setGranularity] = useState(() => {
    if (typeof window === "undefined") return "hour";
    const stored = storedFiltersRef.current ?? getStoredFilters();
    const savedGranularity = stored?.granularity;
    return ["hour", "day"].includes(savedGranularity) ? savedGranularity : "hour";
  });
  const { linkedServices } = useConnectedSites();

  if (storedFiltersRef.current === null) {
    storedFiltersRef.current = {};
  }

  const timeframeDetails = useMemo(
    () => getTimeframeDetails(selectedTimePeriod),
    [selectedTimePeriod]
  );
  const allowedGranularities = timeframeDetails.allowedGranularities;

  const linkedCasinoOptions = useMemo(() => {
    const fromLinkedServices = Array.isArray(linkedServices)
      ? linkedServices
          .map((service) => {
            const identifier =
              service.identifier ??
              service.casino_identifier ??
              service.slug ??
              service.id;

            if (!identifier) return null;

            return {
              identifier,
              name:
                service.name ??
                service.displayName ??
                formatCasinoName(identifier),
            };
          })
          .filter(Boolean)
      : [];

    if (fromLinkedServices.length > 0) {
      return fromLinkedServices;
    }

    if (!Array.isArray(user?.linked_apis)) return [];

    return user.linked_apis
      .map((casino) => {
        if (typeof casino === "string") {
          return {
            identifier: casino,
            name: formatCasinoName(casino),
          };
        }

        if (casino && typeof casino === "object") {
          const identifier =
            casino.identifier ?? casino.casino_identifier ?? casino.slug;

          if (!identifier) return null;

          return {
            identifier,
            name:
              casino.name ?? casino.displayName ?? formatCasinoName(identifier),
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [linkedServices, user?.linked_apis]);

  const defaultCasinoIdentifiers = useMemo(() => {
    return linkedCasinoOptions.map((casino) => casino.identifier);
  }, [linkedCasinoOptions]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const parsedFilters = getStoredFilters();

    if (parsedFilters) {
      storedFiltersRef.current = parsedFilters;

      if (
        typeof parsedFilters.timeframe === "string" &&
        TIMEFRAME_OPTIONS.some(
          (option) => option.value === parsedFilters.timeframe
        )
      ) {
        setSelectedTimePeriod((previous) =>
          previous === parsedFilters.timeframe
            ? previous
            : parsedFilters.timeframe
        );
      }

      if (
        typeof parsedFilters.granularity === "string" &&
        ["hour", "day"].includes(parsedFilters.granularity)
      ) {
        setGranularity((previous) =>
          previous === parsedFilters.granularity
            ? previous
            : parsedFilters.granularity
        );
      }
    } else if (!storedFiltersRef.current) {
      storedFiltersRef.current = {};
    }

    hasHydratedFiltersRef.current = true;
  }, [getStoredFilters]);


  useEffect(() => {
    if (allowedGranularities.includes(granularity)) {
      return;
    }
    setGranularity(allowedGranularities[0]);
  }, [allowedGranularities, granularity]);

  const persistFilters = useCallback(
    (overrides = {}) => {
      if (typeof window === "undefined") return;
      if (!hasHydratedFiltersRef.current) return;
      if (!storageKey) return;

      const payload = {
        timeframe: selectedTimePeriod,
        granularity,
        ...overrides,
      };

      storedFiltersRef.current = payload;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        if (storageKey !== GLOBAL_STORAGE_KEY) {
          window.localStorage.setItem(
            GLOBAL_STORAGE_KEY,
            JSON.stringify(payload)
          );
        }
      } catch (error) {
        console.warn("Failed to persist dashboard filters", error);
      }
    },
    [
      GLOBAL_STORAGE_KEY,
      granularity,
      selectedTimePeriod,
      storageKey,
    ]
  );

  useEffect(() => {
    persistFilters();
  }, [persistFilters]);

  const welcomeMessage = user?.name
    ? `Welcome back, ${user.name.split(" ")[0]}`
    : "Welcome back";

  const handleFetchWagers = useCallback(
    async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const jwt = await getJWT();
        const {
          startDate,
          endDate,
          allowedGranularities: fetchAllowedGranularities,
        } = getTimeframeDetails(selectedTimePeriod);

        const resolvedGranularity = fetchAllowedGranularities.includes(
          granularity
        )
          ? granularity
          : fetchAllowedGranularities[0];

        const casinosToFetch = defaultCasinoIdentifiers.length > 0
          ? defaultCasinoIdentifiers
          : [];

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
            casino_identifiers: casinosToFetch,
            granularity: resolvedGranularity,
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
    },
    [
      defaultCasinoIdentifiers,
      granularity,
      selectedTimePeriod,
      user?.id,
    ]
  );

  useEffect(() => {
    if (user?.id && defaultCasinoIdentifiers.length > 0) {
      handleFetchWagers();
    }
  }, [handleFetchWagers, user?.id, defaultCasinoIdentifiers.length]);

  const onTimePeriodChange = (value) => {
    setSelectedTimePeriod(value);
  };


  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">{welcomeMessage}</h1>
          <p className="text-muted-foreground mt-1.5">
            View your total wager data across all connected casinos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="hour"
                disabled={!allowedGranularities.includes("hour")}
              >
                Hourly
              </SelectItem>
              <SelectItem
                value="day"
                disabled={!allowedGranularities.includes("day")}
              >
                Daily
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => handleFetchWagers()}
            disabled={isLoading}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

