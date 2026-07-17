/** Only admin / super_admin may suspend, ban, or unban users. */
export const MODERATOR_ROLES = ["admin", "super_admin"] as const;

/** Roles that cannot be moderated (protect staff accounts). */
export const PROTECTED_ROLES = new Set(["admin", "super_admin"]);
