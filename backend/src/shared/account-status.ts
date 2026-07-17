/**
 * Community moderation statuses stored in app_auth.auth_users.account_status.
 * CoreMap also uses "disabled" / "deleted"; those are treated as blocked like ban.
 */
export const ACCOUNT_STATUS = {
  active: "active",
  suspended: "suspended",
  banned: "banned",
} as const;

export type ModeratableAccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export function isBannedAccount(
  isActive: boolean,
  accountStatus: string,
): boolean {
  if (!isActive) return true;
  if (accountStatus === ACCOUNT_STATUS.banned) return true;
  // CoreMap-native blocked states
  if (accountStatus === "disabled" || accountStatus === "deleted") return true;
  return false;
}

/** Suspended accounts may log in and read, but must not create posts or react. */
export function isSuspendedAccount(accountStatus: string): boolean {
  return accountStatus === ACCOUNT_STATUS.suspended;
}

/** Full write access only when active and account_status is "active". */
export function canCreateContent(
  isActive: boolean,
  accountStatus: string,
): boolean {
  return isActive && accountStatus === ACCOUNT_STATUS.active;
}
