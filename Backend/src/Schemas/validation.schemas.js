import { z } from "zod";

// MongoDB Hex ObjectId format (24 hexadecimal characters)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const mongoObjectIdSchema = z.string().regex(objectIdRegex, {
  message: "Invalid ID format. Must be a valid 24-character hexadecimal ID",
});

// Auth Schemas
export const signupSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required" })
      .trim()
      .min(1, "First name cannot be empty")
      .max(50, "First name cannot exceed 50 characters"),
    lastName: z
      .string({ required_error: "Last name is required" })
      .trim()
      .min(1, "Last name cannot be empty")
      .max(50, "Last name cannot exceed 50 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .lowercase()
      .email("Invalid email address format")
      .max(100, "Email cannot exceed 100 characters"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password cannot exceed 100 characters"),
    confirmPassword: z.string({ required_error: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .lowercase()
    .email("Invalid email address format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

// Friend Schemas
export const searchFriendSchema = z.object({
  query: z
    .string({ required_error: "Search query is required" })
    .trim()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query too long"),
});

export const inviteByCodeSchema = z.object({
  inviteCode: z
    .string({ required_error: "Invite code, User ID, or email is required" })
    .trim()
    .min(1, "Invite code cannot be empty")
    .max(100, "Invite code input too long"),
});

export const sendInviteSchema = z.object({
  targetUserId: mongoObjectIdSchema,
});

export const acceptRejectInviteSchema = z.object({
  senderUserId: mongoObjectIdSchema,
});

// Route Parameter Schemas
export const idParamSchema = z.object({
  id: mongoObjectIdSchema,
});

// Message Advanced Schemas
export const editMessageSchema = z.object({
  text: z
    .string({ required_error: "Text is required to edit message" })
    .trim()
    .min(1, "Message text cannot be empty")
    .max(10000, "Message text too long"),
});

export const reactionSchema = z.object({
  emoji: z
    .string({ required_error: "Emoji string is required" })
    .trim()
    .min(1, "Emoji cannot be empty")
    .max(10, "Invalid emoji string"),
});

export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: "Query parameter 'q' is required" })
    .trim()
    .min(1, "Search query cannot be empty")
    .max(200, "Search query too long"),
});

