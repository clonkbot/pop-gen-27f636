import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Get all posts, newest first
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

// Get a single post
export const get = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Check if current user liked a post
export const userLikedPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    return !!like;
  },
});

// Create a new post (starts video generation)
export const create = mutation({
  args: { prompt: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const postId = await ctx.db.insert("posts", {
      userId,
      username: args.username,
      prompt: args.prompt,
      status: "generating",
      createdAt: Date.now(),
      likes: 0,
    });

    return postId;
  },
});

// Update post with generated video
export const updateWithVideo = mutation({
  args: {
    postId: v.id("posts"),
    videoStorageId: v.id("_storage"),
    videoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      videoStorageId: args.videoStorageId,
      videoUrl: args.videoUrl,
      status: "complete",
    });
  },
});

// Mark post as failed
export const markFailed = mutation({
  args: { postId: v.id("posts"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
  },
});

// Toggle like on a post
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, { likes: Math.max(0, post.likes - 1) });
    } else {
      await ctx.db.insert("likes", { userId, postId: args.postId });
      await ctx.db.patch(args.postId, { likes: post.likes + 1 });
    }
  },
});

// Generate video action
export const generateVideo = action({
  args: { postId: v.id("posts"), prompt: v.string() },
  handler: async (ctx, args) => {
    try {
      // Enhance prompt for Pixar-style kid-friendly content
      const enhancedPrompt = `Pixar-style 3D animated, colorful, cute, child-friendly, high quality animation: ${args.prompt}`;

      const result = await ctx.runAction(api.ai.generateVideo, {
        prompt: enhancedPrompt,
        aspectRatio: "16:9",
      });

      if (result.storageId && result.url) {
        await ctx.runMutation(api.posts.updateWithVideo, {
          postId: args.postId,
          videoStorageId: result.storageId,
          videoUrl: result.url,
        });
      } else {
        await ctx.runMutation(api.posts.markFailed, {
          postId: args.postId,
          errorMessage: "Video generation returned no result",
        });
      }
    } catch (error) {
      await ctx.runMutation(api.posts.markFailed, {
        postId: args.postId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
