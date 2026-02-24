import { z } from 'zod';
export declare const MessageAttachmentSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["document", "audio", "video", "image"]>;
    url: z.ZodString;
    filename: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodString;
    s3Key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "image" | "document" | "audio" | "video";
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    s3Key: string;
}, {
    id: string;
    type: "image" | "document" | "audio" | "video";
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    s3Key: string;
}>;
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    senderId: z.ZodString;
    receiverId: z.ZodString;
    content: z.ZodString;
    encrypted: z.ZodDefault<z.ZodBoolean>;
    read: z.ZodDefault<z.ZodBoolean>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["document", "audio", "video", "image"]>;
        url: z.ZodString;
        filename: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
        s3Key: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }, {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }>, "many">>;
    createdAt: z.ZodDate;
    readAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    encrypted: boolean;
    read: boolean;
    createdAt: Date;
    attachments?: {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }[] | undefined;
    readAt?: Date | undefined;
}, {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    encrypted?: boolean | undefined;
    read?: boolean | undefined;
    attachments?: {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }[] | undefined;
    readAt?: Date | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const CreateMessageSchema: z.ZodObject<{
    senderId: z.ZodString;
    receiverId: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["document", "audio", "video", "image"]>;
        url: z.ZodString;
        filename: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
        s3Key: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }, {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }>, "many">>;
} & {
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }[] | undefined;
}, {
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: {
        id: string;
        type: "image" | "document" | "audio" | "video";
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        s3Key: string;
    }[] | undefined;
}>;
export type CreateMessageDto = z.infer<typeof CreateMessageSchema>;
