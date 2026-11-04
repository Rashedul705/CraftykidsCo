'use client';

import React, { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

export interface CanProps {
  permission: string | string[];
  any?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
  /**
   * If true, renders children in disabled state instead of hiding it.
   * Useful for buttons that should stay visible but unclickable.
   */
  disableOnly?: boolean;
  disabledTooltip?: string;
}

export function Can({
  permission,
  any = false,
  fallback = null,
  children,
  disableOnly = false,
  disabledTooltip = 'এই কাজের অনুমতি আপনার নেই (Access Denied)',
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isLoading } =
    usePermission();

  if (isLoading) {
    return null;
  }

  let allowed = false;

  if (isSuperAdmin) {
    allowed = true;
  } else if (Array.isArray(permission)) {
    allowed = any ? hasAnyPermission(permission) : hasAllPermissions(permission);
  } else {
    allowed = hasPermission(permission);
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (disableOnly && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      'aria-disabled': 'true',
      title: disabledTooltip,
      className: `${(children as any).props.className || ''} opacity-40 cursor-not-allowed pointer-events-none`.trim(),
    });
  }

  return <>{fallback}</>;
}

export default Can;

