'use client';

import { useEffect } from 'react';
import { setBreadcrumbMetadata, clearBreadcrumbMetadata } from '@/lib/navigation/breadcrumb-store';

interface BreadcrumbMetadataSetterProps {
  /**
   * Map of segment values to their display labels
   * Example: { 'cycle-uuid-123': 'Sprint 2026-1' }
   */
  segmentLabels: Record<string, string> | Map<string, string>;
}

/**
 * BreadcrumbMetadataSetter component
 * 
 * Client component that sets breadcrumb metadata in the store.
 * Pages use this to inject custom labels for dynamic route segments.
 * 
 * Automatically clears metadata on unmount to prevent stale data.
 */
export function BreadcrumbMetadataSetter({
  segmentLabels,
}: BreadcrumbMetadataSetterProps) {
  useEffect(() => {
    // Set metadata when component mounts
    setBreadcrumbMetadata(segmentLabels);
    
    // Clear metadata when component unmounts (navigating away)
    return () => {
      clearBreadcrumbMetadata();
    };
  }, [segmentLabels]);

  // This component doesn't render anything
  return null;
}
