import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveDocument = mutation({
  args: {
    roomId: v.string(),
    content: v.string(),
    language: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if document already exists
    const existing = await ctx.db
      .query("collabDocuments")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, {
        content: args.content,
        language: args.language,
        title: args.title,
        lastModified: Date.now(),
        lastModifiedBy: identity.subject,
      });
    } else {
      // Create new document
      await ctx.db.insert("collabDocuments", {
        roomId: args.roomId,
        content: args.content,
        language: args.language,
        title: args.title || `Collaborative Session ${args.roomId.slice(0, 8)}`,
        createdBy: identity.subject,
        lastModified: Date.now(),
        lastModifiedBy: identity.subject,
      });
    }
  },
});

export const getDocument = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("collabDocuments")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    return document;
  },
});

export const getUserCollabDocuments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("collabDocuments")
      .withIndex("by_created_by")
      .filter((q) => q.eq(q.field("createdBy"), args.userId))
      .order("desc")
      .collect();

    return documents;
  },
});

export const deleteDocument = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const document = await ctx.db
      .query("collabDocuments")
      .withIndex("by_room_id")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();

    if (!document) throw new Error("Document not found");

    // Only creator can delete
    if (document.createdBy !== identity.subject) {
      throw new Error("Not authorized to delete this document");
    }

    await ctx.db.delete(document._id);
  },
});