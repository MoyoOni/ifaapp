"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempleWithRelationsSchema = exports.UpdateTempleSchema = exports.CreateTempleSchema = exports.TempleSchema = exports.CoordinatesSchema = exports.TempleSocialLinksSchema = void 0;
const zod_1 = require("zod");
const temple_enum_js_1 = require("../enums/temple.enum.js");
exports.TempleSocialLinksSchema = zod_1.z.object({
    facebook: zod_1.z.string().url().optional(),
    instagram: zod_1.z.string().url().optional(),
    twitter: zod_1.z.string().url().optional(),
    youtube: zod_1.z.string().url().optional(),
    website: zod_1.z.string().url().optional(),
});
exports.CoordinatesSchema = zod_1.z.object({
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
});
exports.TempleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    yorubaName: zod_1.z.string().optional(),
    slug: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    history: zod_1.z.string().optional(),
    mission: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().default('Nigeria'),
    location: zod_1.z.string().optional(),
    coordinates: exports.CoordinatesSchema.optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    website: zod_1.z.string().url().optional(),
    logo: zod_1.z.string().url().optional(),
    bannerImage: zod_1.z.string().url().optional(),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
    founderId: zod_1.z.string().uuid().optional(),
    foundedYear: zod_1.z.number().int().min(1000).max(3000).optional(),
    status: zod_1.z.nativeEnum(temple_enum_js_1.TempleStatus).default(temple_enum_js_1.TempleStatus.ACTIVE),
    verified: zod_1.z.boolean().default(false),
    verifiedAt: zod_1.z.date().optional(),
    verifiedBy: zod_1.z.string().uuid().optional(),
    type: zod_1.z.nativeEnum(temple_enum_js_1.TempleType).default(temple_enum_js_1.TempleType.STUDY_CIRCLE),
    lineage: zod_1.z.string().optional(),
    tradition: zod_1.z.string().optional(),
    specialties: zod_1.z.array(zod_1.z.string()).default([]),
    socialLinks: exports.TempleSocialLinksSchema.optional(),
    babalawoCount: zod_1.z.number().int().nonnegative().default(0),
    clientCount: zod_1.z.number().int().nonnegative().default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateTempleSchema = exports.TempleSchema.omit({
    id: true,
    verified: true,
    verifiedAt: true,
    verifiedBy: true,
    babalawoCount: true,
    clientCount: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    slug: zod_1.z.string().regex(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
});
exports.UpdateTempleSchema = exports.TempleSchema.partial().omit({
    id: true,
    founderId: true,
    babalawoCount: true,
    clientCount: true,
    createdAt: true,
    updatedAt: true,
});
exports.TempleWithRelationsSchema = exports.TempleSchema.extend({
    founder: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        yorubaName: zod_1.z.string().optional(),
        avatar: zod_1.z.string().url().optional(),
        verified: zod_1.z.boolean(),
    }).optional(),
    babalawos: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        yorubaName: zod_1.z.string().optional(),
        avatar: zod_1.z.string().url().optional(),
        verified: zod_1.z.boolean(),
        bio: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        culturalLevel: zod_1.z.string().optional(),
        certificates: zod_1.z.array(zod_1.z.object({
            tier: zod_1.z.string(),
        })).optional(),
        verificationApps: zod_1.z.array(zod_1.z.object({
            tier: zod_1.z.string().nullable().optional(),
            currentStage: zod_1.z.string(),
        })).optional(),
    })).optional(),
    _count: zod_1.z.object({
        babalawos: zod_1.z.number().int().nonnegative(),
    }).optional(),
});
//# sourceMappingURL=temple.schema.js.map