"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumPostSchema = exports.ForumThreadSchema = exports.ForumCategorySchema = void 0;
const zod_1 = require("zod");
const forum_enum_js_1 = require("../enums/forum.enum.js");
exports.ForumCategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    order: zod_1.z.number().int().default(0),
    isActive: zod_1.z.boolean().default(true),
    isTeachings: zod_1.z.boolean().default(false),
    threadCount: zod_1.z.number().int().default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ForumThreadSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid(),
    authorId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    status: zod_1.z.nativeEnum(forum_enum_js_1.ThreadStatus).default(forum_enum_js_1.ThreadStatus.ACTIVE),
    isPinned: zod_1.z.boolean().default(false),
    isLocked: zod_1.z.boolean().default(false),
    isApproved: zod_1.z.boolean().default(true),
    viewCount: zod_1.z.number().int().default(0),
    postCount: zod_1.z.number().int().default(0),
    lastPostAt: zod_1.z.date().optional(),
    lastPostBy: zod_1.z.string().uuid().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ForumPostSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    threadId: zod_1.z.string().uuid(),
    authorId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1),
    status: zod_1.z.nativeEnum(forum_enum_js_1.PostStatus).default(forum_enum_js_1.PostStatus.ACTIVE),
    isEdited: zod_1.z.boolean().default(false),
    editedAt: zod_1.z.date().optional(),
    acknowledgeCount: zod_1.z.number().int().default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=forum.schema.js.map