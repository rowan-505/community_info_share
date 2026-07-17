import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(120, "Display name must be at most 120 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password must be at most 200 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(6, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
