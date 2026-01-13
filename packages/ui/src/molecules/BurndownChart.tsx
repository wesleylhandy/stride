"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BurndownDataPoint } from "@stride/types";
import { cn } from "../utils/cn";

export interface BurndownChartProps {
  /**
   * Actual burndown data points
   */
  actual: BurndownDataPoint[];
  /**
   * Ideal burndown data points (linear progression)
   */
  ideal?: BurndownDataPoint[];
  /**
   * Total story points at start
   */
  totalStoryPoints?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BurndownChart component
 *
 * Displays a burndown chart showing remaining story points over time.
 * Shows both actual and ideal burndown lines for comparison.
 */
export function BurndownChart({
  actual,
  ideal,
  totalStoryPoints,
  className,
}: BurndownChartProps) {
  // State to control ideal line visibility (default: true)
  const [showIdeal, setShowIdeal] = React.useState(true);

  // Format data for recharts (convert Date objects to strings for display)
  const chartData = React.useMemo(() => {
    const dataMap = new Map<
      string,
      { date: string; actual: number; ideal?: number }
    >();

    // Add actual data points
    actual.forEach((point) => {
      if (point.date) {
        const dateStr = point.date.toISOString().split("T")[0];
        if (dateStr) {
          dataMap.set(dateStr, {
            date: dateStr,
            actual: point.remaining,
          });
        }
      }
    });

    // Add ideal data points if provided
    if (ideal) {
      ideal.forEach((point) => {
        if (point.date) {
          const dateStr = point.date.toISOString().split("T")[0];
          if (dateStr) {
            const existing = dataMap.get(dateStr);
            if (existing) {
              existing.ideal = point.remaining;
            } else {
              dataMap.set(dateStr, {
                date: dateStr,
                actual: 0,
                ideal: point.remaining,
              });
            }
          }
        }
      });
    }

    return Array.from(dataMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [actual, ideal]);

  // Detect dark mode for recharts styling
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(
        document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark"
      );
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Format date for display
  const formatDate = React.useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  // Custom tooltip component - memoized to avoid recreating during render
  const CustomTooltip = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div
            style={{
              backgroundColor: isDark ? "#0d1117" : "#ffffff",
              borderColor: isDark ? "#30363d" : "#d0d7de",
              color: isDark ? "#e6edf3" : "#24292f",
            }}
            className="border rounded-lg shadow-lg p-3"
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: isDark ? "#e6edf3" : "#24292f" }}
            >
              {payload[0]?.payload?.date
                ? formatDate(payload[0].payload.date)
                : ""}
            </p>
            {payload.map(
              (
                entry: { name?: string; value?: number; color?: string },
                index: number
              ) => (
                <p
                  key={index}
                  className="text-sm"
                  style={{ color: entry.color }}
                >
                  {entry.name}: {entry.value?.toFixed(1) || 0} SP
                </p>
              )
            )}
          </div>
        );
      }
      return null;
    },
    [isDark, formatDate]
  );

  if (chartData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          No burndown data available
        </p>
      </div>
    );
  }

  // Determine if ideal should be shown (only if data exists and toggle is on)
  const shouldShowIdeal = showIdeal && ideal && ideal.length > 0;

  return (
    <div className={cn("w-full h-full min-h-[300px] flex flex-col", className)}>
      {/* Toggle for ideal line */}
      {ideal && ideal.length > 0 && (
        <div className="mb-4 flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showIdeal}
              onChange={(e) => setShowIdeal(e.target.checked)}
              className="h-4 w-4 rounded border-border dark:border-border-dark bg-background dark:bg-background-dark text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark"
              aria-label="Show ideal burndown line"
            />
            <span className="text-sm text-foreground dark:text-foreground-dark">
              Show ideal burndown
            </span>
          </label>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#30363d" : "#d0d7de"}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: isDark ? "#8b949e" : "#57606a", fontSize: 12 }}
              stroke={isDark ? "#8b949e" : "#57606a"}
            />
            <YAxis
              tick={{ fill: isDark ? "#8b949e" : "#57606a", fontSize: 12 }}
              stroke={isDark ? "#8b949e" : "#57606a"}
              label={{
                value: "Story Points",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: isDark ? "#8b949e" : "#57606a",
                  fontSize: 12,
                },
              }}
            />
            <Tooltip content={CustomTooltip} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                color: isDark ? "#8b949e" : "#57606a",
                fontSize: "14px",
              }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#00d4aa"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            {shouldShowIdeal && (
              <Line
                type="monotone"
                dataKey="ideal"
                name="Ideal"
                stroke="#4a9eff"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {totalStoryPoints !== undefined && (
        <div className="mt-4 text-sm text-foreground-secondary dark:text-foreground-dark-secondary text-center truncate">
          Total Story Points: {totalStoryPoints}
        </div>
      )}
    </div>
  );
}
