"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMessageSchema = exports.MessageSchema = exports.MessageAttachmentSchema = void 0;
const zod_1 = require("zod");
exports.MessageAttachmentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['document', 'audio', 'video', 'image']),
    url: zod_1.z.string(),
    filename: zod_1.z.string(),
    size: zod_1.z.number().int().positive(),
    mimeType: zod_1.z.string(),
    s3Key: zod_1.z.string()
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    senderId: zod_1.z.string().uuid(),
    receiverId: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    encrypted: zod_1.z.boolean().default(true),
    read: zod_1.z.boolean().default(false),
    attachments: zod_1.z.array(exports.MessageAttachmentSchema).optional(),
    createdAt: zod_1.z.date(),
    readAt: zod_1.z.date().optional()
});
exports.CreateMessageSchema = exports.MessageSchema.omit({
    id: true,
    encrypted: true,
    read: true,
    createdAt: true,
    readAt: true
}).extend({
    content: zod_1.z.string().min(1).max(10000)
});
//# sourceMappingURL=message.schema.js.map