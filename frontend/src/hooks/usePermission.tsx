'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { TAB_PERMISSION_MAP } from '@/lib/permissions';

export interface AdminUserSession {
  id?: string;
  email: string;
  name?: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
  isActive: boolean;
}

interface PermissionContextValue {
  user: AdminUserSession | null;
  permissions: string[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasAllPermissions: (keys: string[]) => boolean;
  canAccessTab: (tabId: string) => boolean;
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

// In-memory cache to deduplicate simultaneous calls across components
let cachedUser: AdminUserSession | null = null;
let fetchPromise: Promise<AdminUserSession | null> | null = null;
const listeners = new Set<(user: AdminUserSession | null) => void>();

async function fetchMe(): Promise<AdminUserSession | null> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/admin/me')
    .then(async (res) => {
      if (!res.ok) {
        cachedUser = null;
        return null;
      }
      const data = await res.json();
      if (data?.authenticated && data?.user) {
        cachedUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          isSuperAdmin: Boolean(data.user.isSuperAdmin),
          permissions: Array.isArray(data.user.permissions) ? data.user.permissions : [],
          isActive: Boolean(data.user.isActive),
        };
        return cachedUser;
      }
      cachedUser = null;
      return null;
    })
    .catch(() => {
      cachedUser = null;
      return null;
    })
    .finally(() => {
      fetchPromise = null;
      listeners.forEach((fn) => fn(cachedUser));
    });

  return fetchPromise;
}

export function AdminPermissionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: AdminUserSession | null;
}) {
  const [user, setUser] = useState<AdminUserSession | null>(initialUser || cachedUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser && !cachedUser);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const u = await fetchMe();
    setUser(u);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (initialUser) {
      cachedUser = initialUser;
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    const listener = (u: AdminUserSession | null) => {
      setUser(u);
      setIsLoading(false);
    };
    listeners.add(listener);

    if (!cachedUser) {
      fetchMe();
    } else {
      setIsLoading(false);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [initialUser]);

  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const permissions = user?.permissions || [];

  const hasPermission = useCallback(
    (key: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      return permissions.includes(key);
    },
    [user, isSuperAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    (keys: string[]): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      return keys.some((k) => permissions.includes(k));
    },
    [user, isSuperAdmin, permissions]
  );

  const hasAllPermissions = useCallback(
    (keys: string[]): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      return keys.every((k) => permissions.includes(k));
    },
    [user, isSuperAdmin, permissions]
  );

  const canAccessTab = useCallback(
    (tabId: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      const reqPerm = TAB_PERMISSION_MAP[tabId];
      if (!reqPerm) return true; // dashboard or unmapped public staff tab
      return permissions.includes(reqPerm);
    },
    [user, isSuperAdmin, permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        isSuperAdmin,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessTab,
        refresh,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permissions in client components.
 * Works inside AdminPermissionProvider or standalone.
 */
export function usePermission() {
  const context = useContext(PermissionContext);
  const [standaloneUser, setStandaloneUser] = useState<AdminUserSession | null>(cachedUser);
  const [standaloneLoading, setStandaloneLoading] = useState<boolean>(!cachedUser);

  useEffect(() => {
    if (context) return; // provider is handling it

    const listener = (u: AdminUserSession | null) => {
      setStandaloneUser(u);
      setStandaloneLoading(false);
    };
    listeners.add(listener);

    if (!cachedUser) {
      fetchMe();
    }

    return () => {
      listeners.delete(listener);
    };
  }, [context]);

  if (context) {
    return context;
  }

  // Standalone fallback
  const isSuperAdmin = Boolean(standaloneUser?.isSuperAdmin);
  const permissions = standaloneUser?.permissions || [];

  return {
    user: standaloneUser,
    permissions,
    isSuperAdmin,
    isLoading: standaloneLoading,
    hasPermission: (key: string): boolean => {
      if (!standaloneUser) return false;
      if (isSuperAdmin) return true;
      return permissions.includes(key);
    },
    hasAnyPermission: (keys: string[]): boolean => {
      if (!standaloneUser) return false;
      if (isSuperAdmin) return true;
      return keys.some((k) => permissions.includes(k));
    },
    hasAllPermissions: (keys: string[]): boolean => {
      if (!standaloneUser) return false;
      if (isSuperAdmin) return true;
      return keys.every((k) => permissions.includes(k));
    },
    canAccessTab: (tabId: string): boolean => {
      if (!standaloneUser) return false;
      if (isSuperAdmin) return true;
      const reqPerm = TAB_PERMISSION_MAP[tabId];
      if (!reqPerm) return true;
      return permissions.includes(reqPerm);
    },
    refresh: async () => {
      setStandaloneLoading(true);
      const u = await fetchMe();
      setStandaloneUser(u);
      setStandaloneLoading(false);
    },
  };
}
