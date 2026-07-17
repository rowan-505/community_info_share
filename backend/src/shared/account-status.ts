/**
 * Account statuses stored in app_auth.auth_users.account_status.
 *
 * The shared CoreMap table enforces CHECK constraint
 * `auth_users_account_status_chk`, which allows ONLY:
 * 'active' | 'disabled' | 'deleted'.
 *
 * Never write any other value (e.g. "suspended" / "banned") — the database
 * rejects the row. Moderation maps Suspend and Ban onto "disabled"
 * (Ban additionally sets is_active = false and revokes sessions).
 */
export const ACCOUNT_STATUS = {
  active: "active",
  disabled: "disabled",
  deleted: "deleted",
} as const;

export type CoreMapAccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

/**
 * Blocked from login / refresh / me and every protected feature.
 * Any non-active status (disabled, deleted) or is_active = false is blocked.
 */
export function isBlockedAccount(
  isActive: boolean,
  accountStatus: string,
): boolean {
  return !isActive || accountStatus !== ACCOUNT_STATUS.active;
}

/** Full write access (posts / reactions) only for active accounts. */
export function canCreateContent(
  isActive: boolean,
  accountStatus: string,
): boolean {
  return isActive && accountStatus === ACCOUNT_STATUS.active;
}

/**
 * Normalize a raw account_status for API responses / display.
 * The DB constraint guarantees valid values, but never leak anything else.
 */
export function toDisplayAccountStatus(
  accountStatus: string,
): CoreMapAccountStatus {
  if (
    accountStatus === ACCOUNT_STATUS.active ||
    accountStatus === ACCOUNT_STATUS.deleted
  ) {
    return accountStatus;
  }
  return ACCOUNT_STATUS.disabled;
}
