import type { DemoUserKey } from "../../config/demo.js";

export interface DemoStatusUser {
  key: DemoUserKey;
  email: string;
  displayName: string;
  roleCode: string;
}

export interface DemoStatusResponse {
  enabled: boolean;
  users: DemoStatusUser[];
}

/**
 * Exact counts of rows removed by a demo reset. All counts are strictly scoped
 * to the three fixed demo users and their demo-created posts.
 */
export interface DemoResetResult {
  demoUserCount: number;
  postsDeleted: number;
  reactionsDeleted: number;
  notificationsDeleted: number;
  sessionsDeleted: number;
}
