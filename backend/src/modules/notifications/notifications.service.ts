import { notificationsRepository } from "./notifications.repository.js";

export const notificationsService = {
  getMyNotifications(userPublicId: string) {
    return notificationsRepository.findByUserPublicId(userPublicId);
  },

  markAsRead(notificationPublicId: string, userPublicId: string) {
    return notificationsRepository.markAsRead(
      notificationPublicId,
      userPublicId,
    );
  },
};
