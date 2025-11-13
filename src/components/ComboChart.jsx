// Tremor ComboChart [v1.0.0]
/* eslint-disable react/prop-types */
"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Dot,
  Label,
  Line,
  ComposedChart as RechartsComposedChart,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
  getYAxisDomain,
  hasOnlyOneValueForKey,
} from "@/lib/chartUtils";
import { useOnWindowResize } from "@/hooks/useOnWindowResize";
import { cn } from "@/lib/utils";

//#region Shape
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

const renderShape = (props, activeBar, activeLegend) => {
  const { fillOpacity, name, payload, value, width, x } = props;
  let { y, height } = props;

  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={
        activeBar || (activeLegend && activeLegend !== name)
          ? deepEqual(activeBar, { ...payload, value })
            ? fillOpacity
            : 0.3
          : fillOpacity
      }
    />
  );
};
//#endregion

//#region Legend
const LegendItem = ({
  name,
  color,
  onClick,
  activeLegend,
  chartType,
}) => {
  const hasOnValueChange = !!onClick;
  const colorClass = getColorClassName(color, "bg");

  return (
    <li
      className={cn(
        "group inline-flex flex-nowrap items-center gap-1.5 rounded-sm px-2 py-1 whitespace-nowrap transition",
        hasOnValueChange
          ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          : "cursor-default"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(name, color);
      }}
    >
      <span
        className={cn(
          { "size-2 rounded-xs": chartType === "bar" },
          {
            "h-[3px] w-3.5 shrink-0 rounded-full": chartType === "line",
          },
          "shrink-0",
          colorClass,
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100"
        )}
        aria-hidden={true}
      />
      <p
        className={cn(
          "truncate text-xs whitespace-nowrap",
          "text-gray-700 dark:text-gray-300",
          hasOnValueChange &&
            "group-hover:text-gray-900 dark:group-hover:text-gray-50",
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100"
        )}
      >
        {name}
      </p>
    </li>
  );
};

const ScrollButton = ({ icon: Icon, onClick, disabled }) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => {
        onClick?.();
      }, 300);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPressed, onClick]);

  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center rounded-md p-1.5 transition-all",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        setIsPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        setIsPressed(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setIsPressed(false);
      }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

const Legend = ({
  categories,
  colors,
  onClickLegendItem,
  activeLegend,
  enableLegendSlider = false,
  legendPosition = "right",
  chartType,
}) => {
  const scrollableRef = React.useRef(null);
  const scrollButtonsRef = React.useRef(null);
  const [isKeyDowned, setIsKeyDowned] = React.useState(null);
  const [scrollableContainerWidth, setScrollableContainerWidth] =
    React.useState(null);
  const [isScrollable, setIsScrollable] = React.useState(false);

  const checkScrollable = React.useCallback(() => {
    if (!scrollableRef.current) return;
    const { scrollWidth, clientWidth } = scrollableRef.current;
    const scrollable = scrollWidth > clientWidth;
    setIsScrollable(scrollable);
    if (scrollable && scrollableContainerWidth === null) {
      setScrollableContainerWidth(scrollWidth);
    }
  }, [scrollableContainerWidth]);

  React.useEffect(() => {
    checkScrollable();
  }, [checkScrollable]);

  useOnWindowResize(() => {
    checkScrollable();
  });

  const scrollToTest = (direction) => {
    if (!scrollableRef.current) return;
    const scrollButtons = scrollButtonsRef.current;
    const scrollButtonsWith = scrollButtons
      ? scrollButtons.offsetWidth
      : 0;
    const containerWidth = scrollableRef.current.offsetWidth;
    const scrollWidth = scrollableRef.current.scrollWidth;

    if (direction === "left") {
      scrollableRef.current.scrollLeft -= containerWidth - scrollButtonsWith;
    } else {
      scrollableRef.current.scrollLeft += containerWidth - scrollButtonsWith;
    }
  };

  const handleKeyDown = (e, name) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClickLegendItem?.(name);
    }
  };

  return (
    <div
      ref={scrollButtonsRef}
      className={cn(
        "relative flex w-full items-center",
        legendPosition === "left" && "justify-start",
        legendPosition === "center" && "justify-center",
        legendPosition === "right" && "justify-end"
      )}
    >
      {enableLegendSlider && isScrollable && (
        <ScrollButton
          icon={ChevronLeft}
          onClick={() => {
            setIsKeyDowned("left");
            scrollToTest("left");
            setTimeout(() => setIsKeyDowned(null), 300);
          }}
          disabled={isKeyDowned === "left"}
        />
      )}
      <div
        ref={scrollableRef}
        className={cn(
          "flex items-center",
          enableLegendSlider && isScrollable
            ? "max-w-[calc(100%-2rem)] overflow-x-auto pl-1"
            : "flex-wrap"
        )}
        onScroll={checkScrollable}
      >
        <ul className={cn("flex items-center gap-2")}>
          {categories.map((category, index) => (
            <LegendItem
              key={`item-${category}`}
              name={category}
              color={colors[index] ?? AvailableChartColors[index % AvailableChartColors.length]}
              onClick={onClickLegendItem}
              activeLegend={activeLegend}
              chartType={chartType}
            />
          ))}
        </ul>
      </div>
      {enableLegendSlider && isScrollable && (
        <ScrollButton
          icon={ChevronRight}
          onClick={() => {
            setIsKeyDowned("right");
            scrollToTest("right");
            setTimeout(() => setIsKeyDowned(null), 300);
          }}
          disabled={isKeyDowned === "right"}
        />
      )}
    </div>
  );
};
//#endregion

//#region Tooltip
const ChartTooltip = ({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  categoryColors,
  barSeries,
  lineSeries,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const allCategories = [
    ...(barSeries?.categories ?? []),
    ...(lineSeries?.categories ?? []),
  ];

  return (
    <div className="w-56 rounded-md border bg-white/5 p-3 text-sm shadow-xs backdrop-blur-md dark:border-gray-800 dark:bg-black/5">
      <p className="mb-2 font-medium text-gray-900 dark:text-gray-50">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="flex flex-col space-y-2">
        {allCategories.map((category, index) => {
          const data = payload.find((p) => p.dataKey === category);
          if (!data) return null;

          const isBar = barSeries?.categories?.includes(category);
          const color = categoryColors.get(category) ?? AvailableChartColors[index % AvailableChartColors.length];
          const valueFormatterFn =
            (isBar ? barSeries?.valueFormatter : lineSeries?.valueFormatter) ??
            ((v) => v.toString());

          return (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    isBar ? "h-2.5 w-2.5 rounded-xs" : "h-1 w-4 rounded-full",
                    getColorClassName(color, "bg")
                  )}
                />
                <p className="text-gray-700 dark:text-gray-400">{category}</p>
              </div>
              <p className="font-medium tabular-nums text-gray-900 dark:text-gray-50">
                {valueFormatterFn(data.value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
//#endregion

export const ComboChart = ({
  data = [],
  index,
  categories = [],
  barSeries = {},
  lineSeries = {},
  startEndOnly = false,
  showXAxis = true,
  xAxisLabel,
  xAxisTickFormatter,
  showGridLines = true,
  intervalType = "equidistantPreserveStart",
  showLegend = true,
  showTooltip = true,
  onValueChange,
  enableLegendSlider = false,
  legendPosition = "right",
  tickGap = 5,
  enableBiaxial = false,
  tooltipCallback,
  customTooltip,
  className,
  ...props
}) => {
  const [activeLegend, setActiveLegend] = React.useState(undefined);
  const [activeBar, setActiveBar] = React.useState(undefined);
  const [activeDot, setActiveDot] = React.useState(undefined);

  const barCategories = barSeries?.categories ?? [];
  const lineCategories = lineSeries?.categories ?? [];
  const allCategories = [...barCategories, ...lineCategories];

  const barColors = barSeries?.colors ?? AvailableChartColors.slice(0, barCategories.length);
  const lineColors = lineSeries?.colors ?? AvailableChartColors.slice(barCategories.length, barCategories.length + lineCategories.length);

  const barCategoryColors = constructCategoryColors(barCategories, barColors);
  const lineCategoryColors = constructCategoryColors(lineCategories, lineColors);
  const allCategoryColors = new Map([...barCategoryColors, ...lineCategoryColors]);

  const [barYAxisDomain, setBarYAxisDomain] = React.useState(["auto", "auto"]);
  const [lineYAxisDomain, setLineYAxisDomain] = React.useState(["auto", "auto"]);

  React.useEffect(() => {
    if (data.length === 0) {
      setBarYAxisDomain(["auto", "auto"]);
      setLineYAxisDomain(["auto", "auto"]);
      return;
    }

    try {
      const barDomain = getYAxisDomain(
        barSeries?.autoMinValue ?? false,
        barSeries?.minValue,
        barSeries?.maxValue,
        data.map((d) =>
          Object.fromEntries(
            barCategories.map((cat) => [cat, d[cat] ?? 0])
          )
        )
      );
      setBarYAxisDomain(barDomain);

      const lineDomain = getYAxisDomain(
        lineSeries?.autoMinValue ?? false,
        lineSeries?.minValue,
        lineSeries?.maxValue,
        data.map((d) =>
          Object.fromEntries(
            lineCategories.map((cat) => [cat, d[cat] ?? 0])
          )
        )
      );
      setLineYAxisDomain(lineDomain);
    } catch (error) {
      console.error("Error calculating Y-axis domains:", error);
      setBarYAxisDomain(["auto", "auto"]);
      setLineYAxisDomain(["auto", "auto"]);
    }
  }, [data, barSeries, lineSeries, barCategories, lineCategories]);

  const handleLegendClick = (name, color) => {
    if (activeLegend === name) {
      setActiveLegend(undefined);
      onValueChange?.(null);
    } else {
      setActiveLegend(name);
      onValueChange?.({
        eventType: "legend",
        categoryClicked: name,
        value: null,
      });
    }
  };

  const handleBarClick = (data, index, event) => {
    if (!onValueChange) return;
    const payload = {
      eventType: "bar",
      categoryClicked: barCategories[index % barCategories.length],
      value: data.total_wagered ?? data[barCategories[index % barCategories.length]],
      payload: data,
    };
    onValueChange(payload);
  };

  const handleLineClick = (data, index, event) => {
    if (!onValueChange) return;
    const payload = {
      eventType: "line",
      categoryClicked: lineCategories[index % lineCategories.length],
      value: data.users_total ?? data[lineCategories[index % lineCategories.length]],
      payload: data,
    };
    onValueChange(payload);
  };

  const TooltipComponent = customTooltip ?? ChartTooltip;

  // Validate data before rendering
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  if (!index || (!barCategories.length && !lineCategories.length)) {
    return null;
  }

  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsComposedChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          onClick={
            onValueChange
              ? () => {
                  setActiveBar(undefined);
                  setActiveDot(undefined);
                  onValueChange(null);
                }
              : undefined
          }
        >
          {showGridLines && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
          <XAxis
            hide={!showXAxis}
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={tickGap}
            interval={startEndOnly ? "preserveStartEnd" : intervalType}
            tickFormatter={xAxisTickFormatter}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -5,
                    style: { textAnchor: "middle" },
                  }
                : undefined
            }
          />
          {barCategories.length > 0 && barSeries?.showYAxis !== false && (
            <YAxis
              yAxisId="left"
              hide={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={barSeries?.yAxisWidth ?? 56}
              domain={barYAxisDomain}
              allowDecimals={barSeries?.allowDecimals ?? true}
              tickFormatter={
                barSeries?.valueFormatter
                  ? (value) => barSeries.valueFormatter(value)
                  : undefined
              }
              label={
                barSeries?.yAxisLabel
                  ? {
                      value: barSeries.yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }
                  : undefined
              }
            />
          )}
          {enableBiaxial && lineCategories.length > 0 && lineSeries?.showYAxis !== false && (
            <YAxis
              yAxisId="right"
              hide={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={lineSeries?.yAxisWidth ?? 56}
              orientation="right"
              domain={lineYAxisDomain}
              allowDecimals={lineSeries?.allowDecimals ?? true}
              tickFormatter={
                lineSeries?.valueFormatter
                  ? (value) => lineSeries.valueFormatter(value)
                  : undefined
              }
              label={
                lineSeries?.yAxisLabel
                  ? {
                      value: lineSeries.yAxisLabel,
                      angle: 90,
                      position: "insideRight",
                      style: { textAnchor: "middle" },
                    }
                  : undefined
              }
            />
          )}
          {showTooltip && (
            <Tooltip
              cursor={false}
              content={({ active, payload, label }) => {
                const tooltipContent = (
                  <TooltipComponent
                    active={active}
                    payload={payload}
                    label={label}
                    labelFormatter={(value) => value}
                    valueFormatter={(value) => value.toString()}
                    categoryColors={allCategoryColors}
                    barSeries={barSeries}
                    lineSeries={lineSeries}
                  />
                );
                tooltipCallback?.({ active, payload, label });
                return tooltipContent;
              }}
            />
          )}
          {barCategories.map((category, index) => {
            const color = barCategoryColors.get(category) ?? AvailableChartColors[index % AvailableChartColors.length];
            // Map color names to actual hex colors for Recharts
            const colorMap = {
              blue: "#3b82f6",
              emerald: "#10b981",
              violet: "#8b5cf6",
              amber: "#f59e0b",
              gray: "#6b7280",
              cyan: "#06b6d4",
              pink: "#ec4899",
              lime: "#84cc16",
              fuchsia: "#d946ef",
            };
            const fillColor = colorMap[color] ?? colorMap.blue;
            return (
              <Bar
                key={`bar-${category}`}
                yAxisId="left"
                dataKey={category}
                type={barSeries?.type ?? "default"}
                fill={fillColor}
                stroke={fillColor}
                shape={(props) =>
                  renderShape(props, activeBar, activeLegend)
                }
                onClick={handleBarClick}
                onMouseEnter={(data, index, event) => {
                  setActiveBar({ ...data.payload, value: data.total_wagered ?? data[category] });
                }}
                onMouseLeave={() => setActiveBar(undefined)}
              />
            );
          })}
          {lineCategories.map((category, index) => {
            const color = lineCategoryColors.get(category) ?? AvailableChartColors[(barCategories.length + index) % AvailableChartColors.length];
            // Map color names to actual hex colors for Recharts
            const colorMap = {
              blue: "#3b82f6",
              emerald: "#10b981",
              violet: "#8b5cf6",
              amber: "#f59e0b",
              gray: "#6b7280",
              cyan: "#06b6d4",
              pink: "#ec4899",
              lime: "#84cc16",
              fuchsia: "#d946ef",
            };
            const strokeColor = colorMap[color] ?? colorMap.emerald;
            return (
              <Line
                key={`line-${category}`}
                yAxisId={enableBiaxial ? "right" : "left"}
                dataKey={category}
                type="monotone"
                stroke={strokeColor}
                strokeWidth={2}
                dot={false}
                connectNulls={lineSeries?.connectNulls ?? false}
                onClick={handleLineClick}
                onMouseEnter={(data, index, event) => {
                  setActiveDot({ ...data.payload, value: data.users_total ?? data[category] });
                }}
                onMouseLeave={() => setActiveDot(undefined)}
              />
            );
          })}
          {showLegend && (
            <RechartsLegend
              verticalAlign="top"
              height={60}
              content={({ payload }) => (
                <Legend
                  categories={allCategories}
                  colors={[...barColors, ...lineColors]}
                  onClickLegendItem={handleLegendClick}
                  activeLegend={activeLegend}
                  enableLegendSlider={enableLegendSlider}
                  legendPosition={legendPosition}
                  chartType="combo"
                />
              )}
            />
          )}
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

