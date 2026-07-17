import { ACCOUNT_STATUS } from "../../shared/account-status.js";
import { adminUsersRepository } from "./admin-users.repository.js";

export const adminUsersService = {
  listUsers() {
    return adminUsersRepository.findCommunityUsers();
  },

  suspend(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.suspended,
      isActive: true,
      revokeSessions: false,
    });
  },

  ban(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.banned,
      isActive: false,
      revokeSessions: true,
    });
  },

  unban(targetPublicId: string, actorPublicId: string) {
    return adminUsersRepository.updateAccountStatus({
      targetPublicId,
      actorPublicId,
      accountStatus: ACCOUNT_STATUS.active,
      isActive: true,
      revokeSessions: false,
    });
  },
};
