import { PostStatus } from "@prisma/client";
import { ADMIN_STATUS_ACTIONS } from "./admin-review.schema.js";
import { adminReviewRepository } from "./admin-review.repository.js";

export const adminReviewService = {
  getPosts() {
    return adminReviewRepository.findAllPosts();
  },

  verify(publicId: string, actorPublicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.verify,
      actorPublicId,
    );
  },

  reject(publicId: string, actorPublicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.reject,
      actorPublicId,
    );
  },

  resolve(publicId: string, actorPublicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.resolve,
      actorPublicId,
    );
  },

  expire(publicId: string, actorPublicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.expire,
      actorPublicId,
    );
  },

  /**
   * Admin unverify: only allowed from admin_verified -> community_confirmed.
   * Does not delete the post, remove reactions, or reset trust score.
   */
  unverify(publicId: string, actorPublicId: string) {
    return adminReviewRepository.updateStatus(
      publicId,
      ADMIN_STATUS_ACTIONS.unverify,
      actorPublicId,
      { requireCurrentStatus: PostStatus.admin_verified },
    );
  },
};
