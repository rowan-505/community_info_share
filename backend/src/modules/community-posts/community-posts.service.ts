import type { FastifyError } from "fastify";
import { communityPostsRepository } from "./community-posts.repository.js";
import type { CreateCommunityPostInput, ReactionType } from "./community-posts.types.js";

function createNotFoundError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 404;
  return error;
}

export const communityPostsService = {
  async getFreeBoardPosts() {
    return communityPostsRepository.findFreeBoardPosts();
  },

  async getReliableBoardPosts() {
    return communityPostsRepository.findReliableBoardPosts();
  },

  async getPostByPublicId(publicId: string) {
    const post = await communityPostsRepository.findByPublicId(publicId);
    if (!post) {
      throw createNotFoundError("Post not found");
    }
    return post;
  },

  async createPost(input: CreateCommunityPostInput, authorPublicId: string) {
    return communityPostsRepository.create(input, authorPublicId);
  },

  async addReaction(
    postPublicId: string,
    userPublicId: string,
    reactionType: ReactionType,
  ) {
    return communityPostsRepository.upsertReaction(
      postPublicId,
      userPublicId,
      reactionType,
    );
  },
};
