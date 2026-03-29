import type { StaffAppRole } from '@gase/shared';

export function getEffectiveStaffRole(userRole?: string | null, storeRole?: string | null) {
  if (userRole === 'SUPER_ADMIN' || userRole === 'OWNER') {
    return userRole as StaffAppRole;
  }

  return (storeRole || userRole || null) as StaffAppRole | null;
}

export function canAccessTab(
  tab: 'home' | 'orders' | 'tables' | 'kitchen' | 'more',
  role?: string | null,
) {
  if (!role) {
    return false;
  }

  if (tab === 'more' || tab === 'home') {
    return true;
  }

  if (tab === 'orders') {
    return ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'WAITER', 'KITCHEN'].includes(role);
  }

  if (tab === 'tables') {
    return ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'WAITER'].includes(role);
  }

  if (tab === 'kitchen') {
    return ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'KITCHEN'].includes(role);
  }

  return false;
}
