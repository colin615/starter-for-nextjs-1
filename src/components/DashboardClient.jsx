"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Filter, RefreshCcw } from "lucide-react";
import { useConnectedSites } from "@/hooks/useConnectedSites";
import { supabase } from "@/lib/supabase";

const FETCH_WAGERS_URL =
  "https://kzrswdfrzmrdqsnsrksh.supabase.co/functions/v1/fetch-wagers";

const CHART_COLOR_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
];

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

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

const buildChartStateFromCasinos = (casinos = [], granularity = "hour") => {
  if (!Array.isArray(casinos) || casinos.length === 0) {
    return {
      data: [],
      config: {},
      keys: [],
      bucketKey: granularity === "day" ? "day_bucket" : "hour_bucket",
    };
  }

  const bucketField = granularity === "day" ? "day_bucket" : "hour_bucket";
  const bucketKey = granularity === "day" ? "day_bucket" : "hour_bucket";

  const bucketSet = new Set();
  const userTotals = new Map();

  const casinoSeries = casinos.map((casino, index) => {
    const rawIdentifier =
      casino?.identifier ??
      casino?.casino_identifier ??
      casino?.slug ??
      casino?.id ??
      casino?.name ??
      `casino-${index + 1}`;

    const normalized = String(rawIdentifier)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const key = /^[A-Za-z_]/.test(normalized)
      ? normalized
      : `casino_${normalized}`;
    const label = formatCasinoName(rawIdentifier);

    const aggregateMap = new Map();

    const aggregates = Array.isArray(casino?.aggregates)
      ? casino.aggregates
      : Array.isArray(casino?.aggregate)
      ? casino.aggregate
      : [];

    aggregates.forEach((entry) => {
      const bucket = entry?.[bucketField];
      if (!bucket) return;
      
      bucketSet.add(bucket);

      const wageredValue = Number.isFinite(Number(entry?.wagered))
        ? Number(entry.wagered)
        : 0;
      aggregateMap.set(bucket, wageredValue);

      const usersValue = Number.isFinite(Number(entry?.user_count))
        ? Number(entry.user_count)
        : 0;
      userTotals.set(bucket, (userTotals.get(bucket) ?? 0) + usersValue);
    });

    return {
      key,
      label,
      aggregateMap,
      colorVar:
        CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] ?? "--chart-1",
    };
  });

  const sortedBuckets = Array.from(bucketSet).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const chartData = sortedBuckets.map((bucket) => {
    let hourlyTotal = 0;
    const row = {
      [bucketKey]: bucket,
      users_total: userTotals.get(bucket) ?? 0,
    };

    casinoSeries.forEach((series) => {
      const wagerValue = series.aggregateMap.get(bucket) ?? 0;
      row[series.key] = wagerValue;
      hourlyTotal += wagerValue;
    });

    row.total_wagered = hourlyTotal;

    return row;
  });

  const chartConfig = casinoSeries.reduce((acc, series) => {
    acc[series.key] = {
      label: series.label,
      color: `var(${series.colorVar})`,
    };
    return acc;
  }, {});

  chartConfig.users_total = {
    label: "Users",
    color: "#2563eb",
  };

  const keys = casinoSeries.map((series) => series.key);

  return { data: chartData, config: chartConfig, keys, bucketKey };
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
  const [selectedCasinos, setSelectedCasinos] = useState([]);
  const [isCasinoSelectOpen, setIsCasinoSelectOpen] = useState(false);
  const [hasInitializedCasinos, setHasInitializedCasinos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wagerChartData, setWagerChartData] = useState([]);
  const [wagerChartConfig, setWagerChartConfig] = useState({});
  const [casinoSeriesKeys, setCasinoSeriesKeys] = useState([]);
  const [wagerBucketKey, setWagerBucketKey] = useState("hour_bucket");
  const [wagerScaleMode, setWagerScaleMode] = useState("auto");
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
    if (hasInitializedCasinos || defaultCasinoIdentifiers.length === 0) {
      return;
    }

    const storedCasinos = Array.isArray(storedFiltersRef.current?.casinos)
      ? storedFiltersRef.current.casinos
      : [];

    if (storedCasinos.length > 0) {
      const validStored = storedCasinos.filter((casinoId) =>
        defaultCasinoIdentifiers.includes(casinoId)
      );

      if (validStored.length > 0) {
        setSelectedCasinos(validStored);
        setHasInitializedCasinos(true);
        return;
      }
    }

    setSelectedCasinos(defaultCasinoIdentifiers);
    setHasInitializedCasinos(true);
  }, [defaultCasinoIdentifiers, hasInitializedCasinos]);

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
        casinos: selectedCasinos,
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
      selectedCasinos,
      selectedTimePeriod,
      storageKey,
    ]
  );

  useEffect(() => {
    persistFilters();
  }, [persistFilters]);

  const selectionCount = selectedCasinos.length;
  const hasActiveFilters =
    selectionCount > 0 &&
    (!defaultCasinoIdentifiers.length ||
      !arraysEqual(selectedCasinos, defaultCasinoIdentifiers));
  const welcomeMessage = user?.name
    ? `Welcome back, ${user.name.split(" ")[0]}`
    : "Welcome back";

  const handleFetchWagers = useCallback(
    async (casinoSelection) => {
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

        const casinosToFetchCandidate = Array.isArray(casinoSelection)
          ? casinoSelection
          : selectedCasinos;
        const casinosToFetch =
          casinosToFetchCandidate.length > 0
            ? casinosToFetchCandidate
            : defaultCasinoIdentifiers;

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

        const casinos = Array.isArray(data?.casinos) ? data.casinos : [];
        const { data: chartData, config, keys, bucketKey } =
          buildChartStateFromCasinos(casinos, resolvedGranularity);
        setWagerChartData(chartData);
        setWagerChartConfig(config);
        setCasinoSeriesKeys(keys);
        setWagerBucketKey(bucketKey);
      } catch (error) {
        console.error("Error calling fetch-wagers:", error);
        setWagerChartData([]);
        setWagerChartConfig({});
        setCasinoSeriesKeys([]);
        setWagerBucketKey("hour_bucket");
      } finally {
        setIsLoading(false);
      }
    },
    [
      defaultCasinoIdentifiers,
      granularity,
      selectedCasinos,
      selectedTimePeriod,
      user?.id,
    ]
  );

  useEffect(() => {
    if (user?.id) {
      handleFetchWagers();
    }
  }, [handleFetchWagers, user?.id]);

  const handleCasinoFilter = useCallback(
    (casinos) => {
      if (arraysEqual(casinos, selectedCasinos)) return;

      setSelectedCasinos(casinos);
      handleFetchWagers(casinos);
      persistFilters({ casinos });
    },
    [handleFetchWagers, persistFilters, selectedCasinos]
  );

  const handleClearFilters = () => {
    if (arraysEqual(selectedCasinos, defaultCasinoIdentifiers)) {
      return;
    }

    setSelectedCasinos(defaultCasinoIdentifiers);
    handleFetchWagers(defaultCasinoIdentifiers);
    setIsCasinoSelectOpen(false);
    persistFilters({ casinos: defaultCasinoIdentifiers });
  };

  const casinoSummary =
    selectionCount > 0
      ? `${selectionCount} casino${selectionCount > 1 ? "s" : ""} selected`
      : "All casinos";

  const handleCasinoToggle = useCallback(
    (casinoId) => {
      const isCurrentlySelected = selectedCasinos.includes(casinoId);
      const nextSelection = isCurrentlySelected
        ? selectedCasinos.filter((id) => id !== casinoId)
        : [...selectedCasinos, casinoId];

      handleCasinoFilter(nextSelection);
      setIsCasinoSelectOpen(true);
    },
    [handleCasinoFilter, selectedCasinos]
  );

  const onTimePeriodChange = (value) => {
    setSelectedTimePeriod(value);
  };

  const { computedYAxisScale, scaleLabel } = useMemo(() => {
    if (!wagerChartData.length) {
      return { computedYAxisScale: "linear", scaleLabel: "Linear scale" };
    }

    const totals = wagerChartData.map(
      (row) => (Number.isFinite(row?.total_wagered) ? row.total_wagered : 0) || 0
    );
    const maxTotal = Math.max(...totals);
    const positiveTotals = totals
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    const medianTotal =
      positiveTotals.length > 0
        ? positiveTotals[Math.floor(positiveTotals.length / 2)]
        : maxTotal;

    const needsCompression =
      medianTotal > 0 ? maxTotal / medianTotal >= 6 : maxTotal > 0;
    const autoScale = needsCompression ? "sqrt" : "linear";
    const resolvedScale =
      wagerScaleMode === "auto" ? autoScale : wagerScaleMode;

    const label =
      wagerScaleMode === "auto"
        ? `Auto (${autoScale === "sqrt" ? "balanced" : "linear"})`
        : resolvedScale === "sqrt"
        ? "Balanced (√)"
        : "Linear";

    return {
      computedYAxisScale: resolvedScale,
      scaleLabel: label,
    };
  }, [wagerChartData, wagerScaleMode]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">{welcomeMessage}</h1>
          <p className="text-muted-foreground mt-1.5">
            Adjust the filters to refine your wager data.
          </p>
        </div>
        <div className="flex items-center gap-2 relative">
          <Select
            open={isCasinoSelectOpen}
            onOpenChange={setIsCasinoSelectOpen}
          >
            <SelectTrigger className="h-9 w-[220px] justify-start gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder={casinoSummary} />
            </SelectTrigger>
            <SelectContent className="w-[260px] p-0">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Filter by casino
                  </span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleClearFilters();
                        setIsCasinoSelectOpen(false);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div className="mt-3 max-h-60 space-y-1 overflow-y-auto pr-1">
                  {linkedCasinoOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No casinos connected
                    </p>
                  ) : (
                    linkedCasinoOptions.map((casino) => {
                      const isSelected =
                        selectedCasinos.includes(casino.identifier);
                      return (
                        <button
                          key={casino.identifier}
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleCasinoToggle(casino.identifier);
                          }}
                          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={isSelected}
                            aria-hidden="true"
                            tabIndex={-1}
                            readOnly
                          />
                          <img
                            src={`/casinos/${casino.identifier}.svg`}
                            alt={casino.name}
                            className="h-6 w-6 shrink-0 rounded"
                          />
                          <div className="flex flex-col text-sm">
                            <span className="font-medium leading-none">
                              {casino.name}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase leading-tight">
                              {casino.identifier}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedCasinos.map((casinoId) => {
                const casino = linkedCasinoOptions.find(
                  (option) => option.identifier === casinoId
                );

                return (
                  <Badge
                    key={casinoId}
                    variant="secondary"
                    className="h-6 px-2 text-xs bg-primary/10 text-primary border border-primary/20"
                  >
                    {casino?.name ?? formatCasinoName(casinoId)}
                  </Badge>
                );
              })}
            </div>
          )}

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
        </div>
      </div>
      <Card className="pt-0">
        <CardHeader className="flex flex-col gap-1 border-b py-5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="grid gap-1">
            <CardTitle>Wager Volume</CardTitle>
            <CardDescription>
              {granularity === "day"
                ? "Daily wager totals for selected casinos"
                : "Hourly wager totals for selected casinos"}
            </CardDescription>
          </div>
          {isLoading && (
            <Badge variant="outline" className="w-fit">
              Loading data…
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <Select value={wagerScaleMode} onValueChange={setWagerScaleMode}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Auto scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="sqrt">Balanced (√)</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {scaleLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {wagerChartData.length > 0 && casinoSeriesKeys.length > 0 ? (
            <ChartContainer
              config={wagerChartConfig}
              className="aspect-auto h-[220px] w-full"
            >
              <ComposedChart data={wagerChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={wagerBucketKey}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) {
                      return value;
                    }
                    if (granularity === "day") {
                      return date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                    }
                    return `${date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })} ${date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;
                  }}
                />
                <YAxis
                  yAxisId="left"
                  type="number"
                  scale={computedYAxisScale}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  }
                />
                <YAxis
                  yAxisId="right"
                  type="number"
                  scale="linear"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        if (Number.isNaN(date.getTime())) {
                          return value;
                        }
                        if (granularity === "day") {
                          return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          });
                        }
                        return date.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                    />
                  }
                />
                {casinoSeriesKeys.map((key) => (
                  <Bar
                    key={key}
                    yAxisId="left"
                    dataKey={key}
                    stackId="wagers"
                    name={wagerChartConfig[key]?.label ?? formatCasinoName(key)}
                    fill={`var(--color-${key})`}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users_total"
                  stroke={`var(--color-users_total)`}
                  strokeWidth={2}
                  dot={false}
                  name={wagerChartConfig.users_total?.label ?? "Users"}
                  isAnimationActive={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-sm text-muted-foreground">
              {isLoading ? "Loading wager data…" : "No wager data available."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

