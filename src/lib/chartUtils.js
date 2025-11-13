// Tremor chartUtils
import { clsx } from "clsx";

export const chartColors = {
  blue: {
    light: "bg-blue-500",
    DEFAULT: "bg-blue-500",
    dark: "bg-blue-500",
    lightFill: "fill-blue-500",
    DEFAULTFill: "fill-blue-500",
    darkFill: "fill-blue-500",
    lightStroke: "stroke-blue-500",
    DEFAULTStroke: "stroke-blue-500",
    darkStroke: "stroke-blue-500",
    lightText: "text-blue-500",
    DEFAULTText: "text-blue-500",
    darkText: "text-blue-500",
  },
  emerald: {
    light: "bg-emerald-500",
    DEFAULT: "bg-emerald-500",
    dark: "bg-emerald-500",
    lightFill: "fill-emerald-500",
    DEFAULTFill: "fill-emerald-500",
    darkFill: "fill-emerald-500",
    lightStroke: "stroke-emerald-500",
    DEFAULTStroke: "stroke-emerald-500",
    darkStroke: "stroke-emerald-500",
    lightText: "text-emerald-500",
    DEFAULTText: "text-emerald-500",
    darkText: "text-emerald-500",
  },
  violet: {
    light: "bg-violet-500",
    DEFAULT: "bg-violet-500",
    dark: "bg-violet-500",
    lightFill: "fill-violet-500",
    DEFAULTFill: "fill-violet-500",
    darkFill: "fill-violet-500",
    lightStroke: "stroke-violet-500",
    DEFAULTStroke: "stroke-violet-500",
    darkStroke: "stroke-violet-500",
    lightText: "text-violet-500",
    DEFAULTText: "text-violet-500",
    darkText: "text-violet-500",
  },
  amber: {
    light: "bg-amber-500",
    DEFAULT: "bg-amber-500",
    dark: "bg-amber-500",
    lightFill: "fill-amber-500",
    DEFAULTFill: "fill-amber-500",
    darkFill: "fill-amber-500",
    lightStroke: "stroke-amber-500",
    DEFAULTStroke: "stroke-amber-500",
    darkStroke: "stroke-amber-500",
    lightText: "text-amber-500",
    DEFAULTText: "text-amber-500",
    darkText: "text-amber-500",
  },
  gray: {
    light: "bg-gray-500",
    DEFAULT: "bg-gray-500",
    dark: "bg-gray-500",
    lightFill: "fill-gray-500",
    DEFAULTFill: "fill-gray-500",
    darkFill: "fill-gray-500",
    lightStroke: "stroke-gray-500",
    DEFAULTStroke: "stroke-gray-500",
    darkStroke: "stroke-gray-500",
    lightText: "text-gray-500",
    DEFAULTText: "text-gray-500",
    darkText: "text-gray-500",
  },
  cyan: {
    light: "bg-cyan-500",
    DEFAULT: "bg-cyan-500",
    dark: "bg-cyan-500",
    lightFill: "fill-cyan-500",
    DEFAULTFill: "fill-cyan-500",
    darkFill: "fill-cyan-500",
    lightStroke: "stroke-cyan-500",
    DEFAULTStroke: "stroke-cyan-500",
    darkStroke: "stroke-cyan-500",
    lightText: "text-cyan-500",
    DEFAULTText: "text-cyan-500",
    darkText: "text-cyan-500",
  },
  pink: {
    light: "bg-pink-500",
    DEFAULT: "bg-pink-500",
    dark: "bg-pink-500",
    lightFill: "fill-pink-500",
    DEFAULTFill: "fill-pink-500",
    darkFill: "fill-pink-500",
    lightStroke: "stroke-pink-500",
    DEFAULTStroke: "stroke-pink-500",
    darkStroke: "stroke-pink-500",
    lightText: "text-pink-500",
    DEFAULTText: "text-pink-500",
    darkText: "text-pink-500",
  },
  lime: {
    light: "bg-lime-500",
    DEFAULT: "bg-lime-500",
    dark: "bg-lime-500",
    lightFill: "fill-lime-500",
    DEFAULTFill: "fill-lime-500",
    darkFill: "fill-lime-500",
    lightStroke: "stroke-lime-500",
    DEFAULTStroke: "stroke-lime-500",
    darkStroke: "stroke-lime-500",
    lightText: "text-lime-500",
    DEFAULTText: "text-lime-500",
    darkText: "text-lime-500",
  },
  fuchsia: {
    light: "bg-fuchsia-500",
    DEFAULT: "bg-fuchsia-500",
    dark: "bg-fuchsia-500",
    lightFill: "fill-fuchsia-500",
    DEFAULTFill: "fill-fuchsia-500",
    darkFill: "fill-fuchsia-500",
    lightStroke: "stroke-fuchsia-500",
    DEFAULTStroke: "stroke-fuchsia-500",
    darkStroke: "stroke-fuchsia-500",
    lightText: "text-fuchsia-500",
    DEFAULTText: "text-fuchsia-500",
    darkText: "text-fuchsia-500",
  },
};

export const AvailableChartColors = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "gray",
  "cyan",
  "pink",
  "lime",
  "fuchsia",
];

export const getColorClassName = (color, type) => {
  const colorKey = AvailableChartColors.includes(color) ? color : "blue";
  return chartColors[colorKey]?.[type] ?? chartColors.blue[type];
};

export const constructCategoryColors = (categories, colors) => {
  const categoryColors = new Map();
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index] ?? AvailableChartColors[index % AvailableChartColors.length]);
  });
  return categoryColors;
};

export const getYAxisDomain = (autoMinValue, minValue, maxValue, data) => {
  if (data.length === 0) return ["auto", "auto"];
  
  const allValues = data.flatMap((d) => Object.values(d).filter((v) => typeof v === "number"));
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  if (autoMinValue && min > 0) {
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }
  
  if (minValue !== undefined && maxValue !== undefined) {
    return [minValue, maxValue];
  }
  
  if (minValue !== undefined) {
    return [minValue, "auto"];
  }
  
  if (maxValue !== undefined) {
    return ["auto", maxValue];
  }
  
  return ["auto", "auto"];
};

export const hasOnlyOneValueForKey = (data, key) => {
  const values = new Set(data.map((d) => d[key]).filter((v) => v != null));
  return values.size <= 1;
};

