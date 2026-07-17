import { request, type ApiResponse } from "./client";

export interface NotificationActor {
  publicId: string;
  displayName: string;
}

export interface NotificationRelatedPost {
  publicId: string;
  title: string;
}

export interface Notification {
  id: string;
  publicId: string;
  type: string;
  reactionType?: string | null;
  title: string;
  message: string;
  relatedPostPublicId: string | null;
  actor?: NotificationActor | null;
  relatedPost?: NotificationRelatedPost | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications(): Promise<Notification[]> {
    return request<ApiResponse<Notification[]>>("/notifications", {
      auth: "required",
    }).then((res) => res.data);
  },

  markAsRead(publicId: string): Promise<Notification> {
    return request<ApiResponse<Notification>>(`/notifications/${publicId}/read`, {
      method: "PATCH",
      auth: "required",
    }).then((res) => res.data);
  },
};
