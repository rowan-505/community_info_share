import { ACCOUNT_STATUS } from "../../shared/account-status.js";
import { adminUsersRepository } from "./admin-users.repository.js";

/**
 * Moderation mapping constrained by the CoreMap CHECK constraint on
 * app_auth.auth_users.account_status ('active' | 'disabled' | 'deleted'):
 *
 * - Suspend → account_status "disabled", is_active true
 * - Ban     → account_status "disabled", is_active false, sessions revoked
 * - Unban   → account_status "active",   is_active true
 *
 * Login blocks any account_status !== "active", so both suspended and banned
 * users cannot log in or use protected features (acceptable for this MVP).
 * is_active distinguishes Suspend (true) from Ban (false) without storing
 * values the DB constraint would reject.
 */
export const adminUsersService = {
  listUsers() {
    return adminUsersRepository.findCommunityUsers();
  },

  suspend(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.disabled,
      isActive: true,
      revokeSessions: false,
      moderationLabel: "suspended",
    });
  },

  ban(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.disabled,
      isActive: false,
      revokeSessions: true,
      moderationLabel: "banned",
    });
  },

  unban(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.active,
      isActive: true,
      revokeSessions: false,
      moderationLabel: null,
    });
  },
};
