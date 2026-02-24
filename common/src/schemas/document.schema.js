"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDocumentSchema = exports.DocumentSchema = void 0;
const zod_1 = require("zod");
exports.DocumentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    uploadedBy: zod_1.z.string().uuid(),
    sharedWith: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['document', 'audio', 'video', 'image']),
    filename: zod_1.z.string().min(1),
    originalFilename: zod_1.z.string(),
    size: zod_1.z.number().int().positive(),
    mimeType: zod_1.z.string(),
    s3Key: zod_1.z.string(),
    signedUrl: zod_1.z.string().url().optional(),
    urlExpiresAt: zod_1.z.date().optional(),
    description: zod_1.z.string().optional(),
    scanned: zod_1.z.boolean().default(false),
    encrypted: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date()
});
exports.CreateDocumentSchema = exports.DocumentSchema.omit({
    id: true,
    uploadedBy: true,
    s3Key: true,
    signedUrl: true,
    urlExpiresAt: true,
    scanned: true,
    encrypted: true,
    createdAt: true
});
//# sourceMappingURL=document.schema.js.map