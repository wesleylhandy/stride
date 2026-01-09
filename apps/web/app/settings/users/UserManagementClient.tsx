"use client";

import * as React from "react";
import { CreateUserForm } from "@/components/CreateUserForm";
import { InviteUserForm } from "@/components/InviteUserForm";
import { UserList } from "@/components/UserList";
import { Button, useToast } from "@stride/ui";
import type { UserListItem } from "@/components/UserList";

/**
 * User Management Client Component
 *
 * Client-side component for user management page.
 * Handles user list fetching, form state, and user interactions.
 */
function UserManagementClientComponent() {
  const toast = useToast();
  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [showInviteForm, setShowInviteForm] = React.useState(false);

  // Component-level refs to prevent concurrent fetches within this instance
  const isFetchingRef = React.useRef(false);

  // Fetch users on mount - refetch on every remount
  // Dependencies: NONE - we only want to fetch once per mount
  // Note: Using toast in effect body is fine, just don't include in deps
  React.useEffect(() => {
    // Prevent concurrent fetches within this component instance
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users");

        if (cancelled) {
          isFetchingRef.current = false;
          return;
        }

        if (!response.ok) {
          if (response.status === 403) {
            toast.error("Access denied", {
              description: "Admin access required to view user management.",
            });
            return;
          }
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        if (!cancelled) {
          setUsers(data.users || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch users:", error);
          toast.error("Failed to load users", {
            description: "Please try refreshing the page.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetch once per mount, refetch on remount

  // Refetch function for manual triggers (user actions)
  // Include toast since it's used in the callback
  const refetchUsers = React.useCallback(async () => {
    if (isFetchingRef.current) {
      return; // Prevent concurrent fetches
    }

    isFetchingRef.current = true;
    try {
      setIsLoading(true);
      const response = await fetch("/api/users");

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Access denied", {
            description: "Admin access required to view user management.",
          });
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users", {
        description: "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]); // Include toast since it's used in the callback

  const handleCreateUserSuccess = () => {
    setShowCreateForm(false);
    refetchUsers();
    toast.success("User created successfully");
  };

  const handleInviteUserSuccess = () => {
    // Don't close form if email wasn't sent (user needs to copy link)
    // Form will handle its own state
    refetchUsers();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            User Management
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Manage users, create accounts, and send invitations.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowInviteForm(false);
              setShowCreateForm(!showCreateForm);
            }}
          >
            {showCreateForm ? "Cancel" : "Create User"}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowCreateForm(false);
              setShowInviteForm(!showInviteForm);
            }}
          >
            {showInviteForm ? "Cancel" : "Invite User"}
          </Button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
            Create New User
          </h2>
          <CreateUserForm
            onSuccess={handleCreateUserSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Invite User Form */}
      {showInviteForm && (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
            Invite New User
          </h2>
          <InviteUserForm
            onSuccess={handleInviteUserSuccess}
            onCancel={() => setShowInviteForm(false)}
          />
        </div>
      )}

      {/* User List */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          All Users
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                Loading users...
              </p>
            </div>
          </div>
        ) : (
          <UserList users={users} />
        )}
      </div>
    </div>
  );
}

// Don't use React.memo - component has no props, so memo won't help
// The issue was useToast() returning new object references
export const UserManagementClient = UserManagementClientComponent;
