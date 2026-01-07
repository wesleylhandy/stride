'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BurndownDataPoint } from '@stride/types';
import { cn } from '../utils/cn';

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
  // Format data for recharts (convert Date objects to strings for display)
  const chartData = React.useMemo(() => {
    const dataMap = new Map<string, { date: string; actual: number; ideal?: number }>();

    // Add actual data points
    actual.forEach((point) => {
      if (point.date) {
        const dateStr = point.date.toISOString().split('T')[0];
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
          const dateStr = point.date.toISOString().split('T')[0];
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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-2">
            {payload[0]?.payload?.date ? formatDate(payload[0].payload.date) : ''}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value?.toFixed(1) || 0} SP
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-foreground-secondary">No burndown data available</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full min-h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-foreground-secondary text-xs"
            stroke="currentColor"
          />
          <YAxis
            className="text-foreground-secondary text-xs"
            stroke="currentColor"
            label={{
              value: 'Story Points',
              angle: -90,
              position: 'insideLeft',
              className: 'text-foreground-secondary text-xs',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            className="text-foreground-secondary text-sm"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {ideal && ideal.length > 0 && (
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {totalStoryPoints !== undefined && (
        <div className="mt-4 text-sm text-foreground-secondary text-center">
          Total Story Points: {totalStoryPoints}
        </div>
      )}
    </div>
  );
}

