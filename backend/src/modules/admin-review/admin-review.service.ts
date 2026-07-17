import { ADMIN_STATUS_ACTIONS } from "./admin-review.schema.js";
import { adminReviewRepository } from "./admin-review.repository.js";

export const adminReviewService = {
  getPosts() {
    return adminReviewRepository.findAllPosts();
  },

  verify(publicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.verify,
    );
  },

  reject(publicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.reject,
    );
  },

  resolve(publicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.resolve,
    );
  },

  expire(publicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.expire,
    );
  },
};
