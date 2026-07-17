export const errorResponseSchema = {
  $id: "ErrorResponse",
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["error", "message"],
} as const;

export const healthResponseSchema = {
  $id: "HealthResponse",
  type: "object",
  properties: {
    status: { type: "string" },
  },
  required: ["status"],
} as const;

export const minimalUserSchema = {
  $id: "MinimalUser",
  type: "object",
  properties: {
    id: { type: "string" },
    public_id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    display_name: { type: "string" },
    roles: { type: "array", items: { type: "string" } },
  },
  required: ["id", "public_id", "email", "display_name", "roles"],
} as const;

export const authProfileSchema = {
  $id: "AuthProfile",
  type: "object",
  properties: {
    id: { type: "string" },
    public_id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    display_name: { type: "string" },
    phone: { type: ["string", "null"] },
    roles: { type: "array", items: { type: "string" } },
    email_verified: { type: "boolean" },
    account_status: { type: "string" },
    primary_region_id: { type: ["string", "null"] },
    preferred_language: { type: "string" },
  },
  required: [
    "id",
    "public_id",
    "email",
    "display_name",
    "phone",
    "roles",
    "email_verified",
    "account_status",
    "primary_region_id",
    "preferred_language",
  ],
} as const;

export const sessionResponseSchema = {
  $id: "SessionResponse",
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "string" },
    user: { $ref: "MinimalUser#" },
  },
  required: ["accessToken", "refreshToken", "expiresIn", "user"],
} as const;

export const registerResponseSchema = {
  $id: "RegisterResponse",
  type: "object",
  properties: {
    message: { type: "string" },
    user: { $ref: "AuthProfile#" },
  },
  required: ["message", "user"],
} as const;

export const messageResponseSchema = {
  $id: "MessageResponse",
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
} as const;

export const registerBodySchema = {
  $id: "RegisterBody",
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    displayName: { type: "string", minLength: 2, maxLength: 120 },
    password: { type: "string", minLength: 8, maxLength: 200 },
  },
  required: ["email", "displayName", "password"],
} as const;

export const loginBodySchema = {
  $id: "LoginBody",
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 6 },
  },
  required: ["email", "password"],
} as const;

export const refreshBodySchema = {
  $id: "RefreshBody",
  type: "object",
  properties: {
    refreshToken: { type: "string", minLength: 1 },
  },
  required: ["refreshToken"],
} as const;

export const logoutBodySchema = {
  $id: "LogoutBody",
  type: "object",
  properties: {
    refreshToken: { type: "string", minLength: 1 },
  },
  required: ["refreshToken"],
} as const;

export const postReactionsSchema = {
  $id: "PostReactions",
  type: "object",
  properties: {
    confirm: { type: "integer" },
    useful: { type: "integer" },
    fake: { type: "integer" },
    resolved: { type: "integer" },
  },
  required: ["confirm", "useful", "fake", "resolved"],
} as const;

export const communityPostSchema = {
  $id: "CommunityPost",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    publicId: { type: "string", format: "uuid" },
    title: { type: "string" },
    description: { type: "string" },
    topic: { type: "string" },
    authorName: { type: "string" },
    status: {
      type: "string",
      enum: [
        "free_board",
        "community_confirmed",
        "admin_verified",
        "rejected",
        "resolved",
        "expired",
      ],
    },
    trustScore: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
    reactions: { $ref: "PostReactions#" },
  },
  required: [
    "id",
    "publicId",
    "title",
    "description",
    "topic",
    "authorName",
    "status",
    "trustScore",
    "createdAt",
    "reactions",
  ],
} as const;

export const communityPostResponseSchema = {
  $id: "CommunityPostResponse",
  type: "object",
  properties: {
    data: { $ref: "CommunityPost#" },
  },
  required: ["data"],
} as const;

export const communityPostsResponseSchema = {
  $id: "CommunityPostsResponse",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: { $ref: "CommunityPost#" },
    },
  },
  required: ["data"],
} as const;

export const createPostBodySchema = {
  $id: "CreatePostBody",
  type: "object",
  properties: {
    title: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    topic: { type: "string", minLength: 1 },
  },
  required: ["title", "description", "topic"],
} as const;

export const reactionBodySchema = {
  $id: "ReactionBody",
  type: "object",
  properties: {
    reactionType: {
      type: "string",
      enum: ["confirm", "useful", "fake", "resolved"],
    },
  },
  required: ["reactionType"],
} as const;

export const notificationSchema = {
  $id: "Notification",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    publicId: { type: "string", format: "uuid" },
    type: {
      type: "string",
      enum: [
        "community_confirmed",
        "admin_verified",
        "rejected",
        "resolved",
        "expired",
        "post_reaction",
        "post_community_confirmed",
        "post_admin_verified",
        "post_admin_unverified",
        "post_rejected",
        "post_resolved",
        "post_expired",
      ],
    },
    reactionType: {
      type: ["string", "null"],
      enum: ["confirm", "useful", "fake", "resolved", null],
    },
    title: { type: "string" },
    message: { type: "string" },
    relatedPostPublicId: { type: ["string", "null"], format: "uuid" },
    actor: {
      type: ["object", "null"],
      properties: {
        publicId: { type: "string", format: "uuid" },
        displayName: { type: "string" },
      },
    },
    relatedPost: {
      type: ["object", "null"],
      properties: {
        publicId: { type: "string", format: "uuid" },
        title: { type: "string" },
      },
    },
    isRead: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "publicId", "type", "title", "message", "isRead", "createdAt"],
} as const;

export const notificationsResponseSchema = {
  $id: "NotificationsResponse",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: { $ref: "Notification#" },
    },
  },
  required: ["data"],
} as const;

export const notificationResponseSchema = {
  $id: "NotificationResponse",
  type: "object",
  properties: {
    data: { $ref: "Notification#" },
  },
  required: ["data"],
} as const;

export const publicIdParamSchema = {
  $id: "PublicIdParam",
  type: "object",
  properties: {
    publicId: {
      type: "string",
      format: "uuid",
      description: "Public UUID identifier",
    },
  },
  required: ["publicId"],
} as const;

export const allSchemas = [
  errorResponseSchema,
  healthResponseSchema,
  minimalUserSchema,
  authProfileSchema,
  sessionResponseSchema,
  registerResponseSchema,
  messageResponseSchema,
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  logoutBodySchema,
  postReactionsSchema,
  communityPostSchema,
  communityPostResponseSchema,
  communityPostsResponseSchema,
  createPostBodySchema,
  reactionBodySchema,
  notificationSchema,
  notificationsResponseSchema,
  notificationResponseSchema,
  publicIdParamSchema,
];

export const bearerSecurity = [{ bearerAuth: [] }] as const;

export const commonErrors = {
  400: {
    description: "Validation error",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Validation Error", message: "Title is required" },
      },
    },
  },
  401: {
    description: "Unauthorized — missing or invalid JWT",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Unauthorized", message: "Invalid or missing token" },
      },
    },
  },
  403: {
    description: "Forbidden — insufficient role or account restricted",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Forbidden", message: "Admin access required" },
      },
    },
  },
  404: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Post not found", message: "Post not found" },
      },
    },
  },
  409: {
    description: "Conflict",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Email already registered", message: "Email already registered" },
      },
    },
  },
  429: {
    description: "Too many requests — rate limit exceeded",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Too Many Requests", message: "Rate limit exceeded" },
      },
    },
  },
  500: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: { $ref: "ErrorResponse#" },
        example: { error: "Internal Server Error", message: "Unexpected error" },
      },
    },
  },
};
