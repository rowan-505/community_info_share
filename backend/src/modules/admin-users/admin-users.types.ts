export interface ModeratedUser {
  publicId: string;
  email: string;
  displayName: string;
  accountStatus: string;
  isActive: boolean;
  roles: string[];
  postCount: number;
}
