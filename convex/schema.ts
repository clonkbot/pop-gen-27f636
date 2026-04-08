import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Video posts in the feed
  posts: defineTable({
    userId: v.id("users"),
    username: v.string(),
    prompt: v.string(),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    status: v.union(v.literal("generating"), v.literal("complete"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    likes: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId"]),

  // Track which users liked which posts
  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user_and_post", ["userId", "postId"])
    .index("by_post", ["postId"]),
});
