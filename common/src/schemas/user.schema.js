"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserSchema = exports.CreateUserSchema = exports.UserSchema = exports.SocialLinkSchema = void 0;
const zod_1 = require("zod");
const user_role_enum_js_1 = require("../enums/user-role.enum.js");
const cultural_level_enum_js_1 = require("../enums/cultural-level.enum.js");
exports.SocialLinkSchema = zod_1.z.object({
    platform: zod_1.z.enum(['twitter', 'instagram', 'website', 'other']),
    url: zod_1.z.string().url()
});
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    role: zod_1.z.nativeEnum(user_role_enum_js_1.UserRole),
    yorubaName: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
    verified: zod_1.z.boolean().default(false),
    bio: zod_1.z.string().optional(),
    aboutMe: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    age: zod_1.z.number().int().positive().optional(),
    location: zod_1.z.string().optional(),
    socialLinks: zod_1.z.array(exports.SocialLinkSchema).optional(),
    culturalLevel: zod_1.z.nativeEnum(cultural_level_enum_js_1.CulturalLevel).default(cultural_level_enum_js_1.CulturalLevel.OMO_ILE),
    rankXP: zod_1.z.number().int().nonnegative().default(0),
    dialectPreference: zod_1.z.string().optional(),
    hasOnboarded: zod_1.z.boolean().default(false),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
    themeColor: zod_1.z.string().optional(),
    profileVisibility: zod_1.z.enum(['public', 'private', 'community']).default('community'),
    templeId: zod_1.z.string().uuid().optional(),
    temple: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        yorubaName: zod_1.z.string().optional(),
        slug: zod_1.z.string(),
        logo: zod_1.z.string().url().optional(),
        verified: zod_1.z.boolean(),
    }).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateUserSchema = exports.UserSchema.omit({
    id: true,
    verified: true,
    rankXP: true,
    hasOnboarded: true,
    createdAt: true,
    updatedAt: true
}).extend({
    password: zod_1.z.string().min(8)
});
exports.UpdateUserSchema = exports.UserSchema.partial().omit({
    id: true,
    email: true,
    role: true,
    verified: true,
    createdAt: true,
    updatedAt: true
});
//# sourceMappingURL=user.schema.js.map