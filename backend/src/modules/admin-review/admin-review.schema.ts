import { PostStatus } from "@prisma/client";

export const REVIEWER_ROLES = ["admin", "super_admin"] as const;

export const ADMIN_STATUS_ACTIONS = {
  verify: PostStatus.admin_verified,
  reject: PostStatus.rejected,
  resolve: PostStatus.resolved,
  expire: PostStatus.expired,
} as const;

export type AdminAction = keyof typeof ADMIN_STATUS_ACTIONS;
