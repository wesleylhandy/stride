# Sync Status Card Design

**Feature**: Manual Issue Sync - Single Well-Placed Button  
**Created**: 2026-01-27  
**Purpose**: Design specification for Sync Status Card component

## Overview

The Sync Status Card is a prominent component that provides:
- Single, well-placed sync button
- Sync status information (last sync time, webhook status)
- Sync options (sync type, include closed)
- Quick action buttons for common sync types

**Location**: Project Settings → Integrations (top of page, above connection info)

**Visibility**: Only shown when repository connection exists

---

## Component Structure

### SyncStatusCard Component

```typescript
interface SyncStatusCardProps {
  projectId: string;
  repositoryConnection: {
    id: string;
    repositoryUrl: string;
    serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
    isActive: boolean;
    lastSyncAt: string | null;
  };
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Repository Sync                              [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Status:                                                     │
│ • Last synced: 5 minutes ago                                │
│ • Webhook: Active ✓                                         │
│ • Repository: github.com/owner/repo                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [Sync Issues]  [Full ▼]  [Include Closed ☐]        │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Quick Actions:                                              │
│ [Full Sync]  [Issues Only]  [Security Only]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### States

#### 1. **Idle State** (Default)
- Shows last sync time
- Shows webhook status (Active/Inactive)
- Shows repository URL
- Primary button: "Sync Issues"
- Sync type dropdown: "Full"
- Include closed checkbox: Unchecked

#### 2. **Syncing State**
- Shows progress indicator
- Disables all buttons
- Shows "Syncing..." text
- Opens SyncProgressDialog if async

#### 3. **Success State** (Temporary)
- Shows success message with results
- "15 issues created, 3 updated"
- Auto-dismisses after 5 seconds

#### 4. **Error State**
- Shows error message
- Provides retry button
- Shows actionable suggestions

#### 5. **Inactive Webhook State**
- Shows warning indicator
- Highlights that webhook is inactive
- Suggests manual sync is needed

---

## Component Implementation

### SyncStatusCard Component

```typescript
'use client';

import { useState } from 'react';
import { ManualSyncButton } from './ManualSyncButton';
import { Badge } from '@stride/ui';
import { formatDistanceToNow } from 'date-fns';

export interface SyncStatusCardProps {
  projectId: string;
  repositoryConnection: {
    id: string;
    repositoryUrl: string;
    serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
    isActive: boolean;
    lastSyncAt: string | null;
  };
}

export function SyncStatusCard({
  projectId,
  repositoryConnection,
}: SyncStatusCardProps) {
  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'GitHub':
        return '🐙';
      case 'GitLab':
        return '🦊';
      case 'Bitbucket':
        return '🔷';
      default:
        return '📦';
    }
  };

  return (
    <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getServiceIcon(repositoryConnection.serviceType)}</span>
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Repository Sync
          </h2>
        </div>
        <Badge
          variant={repositoryConnection.isActive ? 'success' : 'warning'}
        >
          {repositoryConnection.isActive ? 'Webhook Active' : 'Webhook Inactive'}
        </Badge>
      </div>

      {/* Status Information */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Last synced:
          </span>
          <span className="font-medium text-foreground dark:text-foreground-dark">
            {formatLastSync(repositoryConnection.lastSyncAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Repository:
          </span>
          <a
            href={repositoryConnection.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-mono text-xs"
          >
            {repositoryConnection.repositoryUrl}
          </a>
        </div>
        {!repositoryConnection.isActive && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md mt-3">
            <p className="text-sm text-foreground dark:text-foreground-dark">
              ⚠️ Webhook is inactive. Use manual sync to update issues from the repository.
            </p>
          </div>
        )}
      </div>

      {/* Primary Sync Controls */}
      <div className="mb-4">
        <ManualSyncButton
          projectId={projectId}
          repositoryId={repositoryConnection.id}
          isActive={repositoryConnection.isActive}
          syncType="full"
          showSyncTypeSelector={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-border dark:border-border-dark">
        <p className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
          Quick Actions:
        </p>
        <div className="flex flex-wrap gap-2">
          <ManualSyncButton
            projectId={projectId}
            repositoryId={repositoryConnection.id}
            isActive={repositoryConnection.isActive}
            syncType="full"
            showSyncTypeSelector={false}
            className="text-sm"
          />
          <ManualSyncButton
            projectId={projectId}
            repositoryId={repositoryConnection.id}
            isActive={repositoryConnection.isActive}
            syncType="issuesOnly"
            showSyncTypeSelector={false}
            className="text-sm"
          />
          <ManualSyncButton
            projectId={projectId}
            repositoryId={repositoryConnection.id}
            isActive={repositoryConnection.isActive}
            syncType="securityOnly"
            showSyncTypeSelector={false}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Integration with RepositoryConnectionSettings

### Updated Structure

```typescript
export function RepositoryConnectionSettings({
  projectId,
}: RepositoryConnectionSettingsProps) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* Sync Status Card - NEW, Prominent */}
      {connection && (
        <SyncStatusCard
          projectId={projectId}
          repositoryConnection={connection}
        />
      )}

      {/* Connection Info Card - Separate */}
      {connection ? (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
            Connection Information
          </h2>
          {/* Connection details */}
          <div className="space-y-2">
            {/* Service type, URL, dates */}
          </div>
          <div className="mt-4">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              To update your connection, use the form below.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <div className="flex items-center gap-3">
            <Badge variant="default">Not Connected</Badge>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No repository connection configured for this project.
            </p>
          </div>
        </div>
      )}

      {/* Connection Form */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          {connection ? 'Update Connection' : 'Connect Repository'}
        </h2>
        <RepositoryConnectionForm
          projectId={projectId}
          onSubmit={handleManualConnection}
          onOAuthClick={handleOAuthClick}
          loading={isConnecting}
          oauthLoading={isOAuthLoading}
          error={error}
          requireRepositoryUrlForOAuth={true}
        />
      </div>
    </div>
  );
}
```

---

## Benefits

1. **Single Well-Placed Button**: One primary sync button in prominent location
2. **Discoverability**: Card is impossible to miss at top of page
3. **Information Density**: All sync-related info in one place
4. **Clear Hierarchy**: Sync action separate from connection configuration
5. **Contextual Status**: Shows when sync is needed (inactive webhook)
6. **Quick Actions**: Secondary buttons for common sync types
7. **Clean UI**: Doesn't clutter work areas (Board/Issues)

---

## Accessibility

- Card has proper heading structure (`h2`)
- Status information uses semantic HTML
- Buttons have proper ARIA labels
- Webhook status uses Badge component (accessible)
- Links have proper `target="_blank"` and `rel` attributes

---

## Responsive Design

- Card stacks vertically on mobile
- Quick action buttons wrap on small screens
- Status information remains readable at all sizes
- Sync button maintains full width on mobile
