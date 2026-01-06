'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
  type?: string;
}

export interface LinkPreviewProps {
  /**
   * Preview data
   */
  preview: LinkPreviewData;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when preview fails to load
   */
  onError?: () => void;
}

/**
 * LinkPreview component
 * 
 * Displays a rich preview card for external links.
 * Gracefully degrades to a simple link if preview data is incomplete.
 */
export function LinkPreview({
  preview,
  className,
  onError,
}: LinkPreviewProps) {
  const [imageError, setImageError] = React.useState(false);

  // If we don't have enough data, show as a simple link
  const hasEnoughData = preview.title || preview.description || preview.image;

  if (!hasEnoughData) {
    return (
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'text-primary hover:underline inline-flex items-center gap-1',
          className
        )}
      >
        {preview.url}
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block border border-border rounded-lg overflow-hidden',
        'hover:border-primary transition-colors',
        'bg-background-secondary',
        className
      )}
    >
      {preview.image && !imageError && (
        <div className="w-full h-48 bg-background-tertiary overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || 'Link preview'}
            className="w-full h-full object-cover"
            onError={() => {
              setImageError(true);
              onError?.();
            }}
          />
        </div>
      )}
      <div className="p-4">
        {preview.siteName && (
          <div className="text-xs text-foreground-secondary uppercase tracking-wide mb-1">
            {preview.siteName}
          </div>
        )}
        {preview.title && (
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {preview.title}
          </h3>
        )}
        {preview.description && (
          <p className="text-sm text-foreground-secondary line-clamp-2">
            {preview.description}
          </p>
        )}
        <div className="mt-2 text-xs text-foreground-tertiary truncate">
          {preview.url}
        </div>
      </div>
    </a>
  );
}

