export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'SUPPORT';

const USER_ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  PASSENGER: ['PASSENGER'],
  DRIVER: ['DRIVER'],
  ADMIN: ['ADMIN'],
  SUPPORT: ['SUPPORT'],
};

export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }

  const value = phone.replace(/\s+/g, '').trim();
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (value.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.startsWith('251') && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+251${digits}`;
  }

  return `+${digits}`;
}

export function getUserRoleHierarchy(role: string): UserRole[] {
  const normalized = role.toUpperCase() as UserRole;
  return USER_ROLE_HIERARCHY[normalized] ?? [normalized];
}

export function isRoleAllowed(userRole: string, requiredRole: string): boolean {
  const normalizedUserRole = userRole.toUpperCase();
  const normalizedRequiredRole = requiredRole.toUpperCase();

  if (normalizedUserRole === normalizedRequiredRole) {
    return true;
  }

  return getUserRoleHierarchy(normalizedUserRole).includes(normalizedRequiredRole as UserRole);
}
