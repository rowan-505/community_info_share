import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  topic: z.string().trim().min(1, "Topic is required"),
});

export const reactionSchema = z.object({
  reactionType: z.enum(["confirm", "useful", "fake", "resolved"]),
});
