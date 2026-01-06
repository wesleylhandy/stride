'use client';

import * as React from 'react';
import { BurndownChart } from '@stride/ui';
import type { BurndownDataPoint } from '@stride/types';

export interface BurndownChartClientProps {
  projectId: string;
  cycleId: string;
}

/**
 * BurndownChartClient component
 * 
 * Client-side wrapper for BurndownChart that handles:
 * - API calls to fetch burndown data
 * - Loading states
 * - Error handling
 */
export function BurndownChartClient({
  projectId,
  cycleId,
}: BurndownChartClientProps) {
  const [burndownData, setBurndownData] = React.useState<{
    actual: BurndownDataPoint[];
    ideal: BurndownDataPoint[];
    totalStoryPoints: number;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchBurndown = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/cycles/${cycleId}/burndown`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch burndown data');
        }

        const data = await response.json();
        setBurndownData({
          actual: data.actual.map((point: { date: string; remaining: number }) => ({
            date: new Date(point.date),
            remaining: point.remaining,
          })),
          ideal: data.ideal.map((point: { date: string; remaining: number }) => ({
            date: new Date(point.date),
            remaining: point.remaining,
          })),
          totalStoryPoints: data.totalStoryPoints,
        });
      } catch (err) {
        console.error('Failed to fetch burndown data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch burndown data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBurndown();
  }, [projectId, cycleId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-foreground-secondary">Loading burndown chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-foreground-secondary">{error}</p>
      </div>
    );
  }

  if (!burndownData || burndownData.actual.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-foreground-secondary">No burndown data available</p>
      </div>
    );
  }

  return (
    <BurndownChart
      actual={burndownData.actual}
      ideal={burndownData.ideal}
      totalStoryPoints={burndownData.totalStoryPoints}
      className="h-[400px]"
    />
  );
}

