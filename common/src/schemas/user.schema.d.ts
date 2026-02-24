import { z } from 'zod';
import { UserRole } from '../enums/user-role.enum.js';
import { CulturalLevel } from '../enums/cultural-level.enum.js';
export declare const SocialLinkSchema: z.ZodObject<{
    platform: z.ZodEnum<["twitter", "instagram", "website", "other"]>;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    platform: "website" | "instagram" | "twitter" | "other";
    url: string;
}, {
    platform: "website" | "instagram" | "twitter" | "other";
    url: string;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    yorubaName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
    bio: z.ZodOptional<z.ZodString>;
    aboutMe: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["twitter", "instagram", "website", "other"]>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }>, "many">>;
    culturalLevel: z.ZodDefault<z.ZodNativeEnum<typeof CulturalLevel>>;
    rankXP: z.ZodDefault<z.ZodNumber>;
    dialectPreference: z.ZodOptional<z.ZodString>;
    hasOnboarded: z.ZodDefault<z.ZodBoolean>;
    interests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    themeColor: z.ZodOptional<z.ZodString>;
    profileVisibility: z.ZodDefault<z.ZodEnum<["public", "private", "community"]>>;
    templeId: z.ZodOptional<z.ZodString>;
    temple: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        yorubaName: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        logo: z.ZodOptional<z.ZodString>;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    email: string;
    name: string;
    role: UserRole;
    culturalLevel: CulturalLevel;
    rankXP: number;
    profileVisibility: "public" | "private" | "community";
    verified: boolean;
    hasOnboarded: boolean;
    updatedAt: Date;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    interests?: string[] | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    email: string;
    name: string;
    role: UserRole;
    updatedAt: Date;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    culturalLevel?: CulturalLevel | undefined;
    rankXP?: number | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    profileVisibility?: "public" | "private" | "community" | undefined;
    interests?: string[] | undefined;
    verified?: boolean | undefined;
    hasOnboarded?: boolean | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
export declare const CreateUserSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    yorubaName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
    bio: z.ZodOptional<z.ZodString>;
    aboutMe: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["twitter", "instagram", "website", "other"]>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }>, "many">>;
    culturalLevel: z.ZodDefault<z.ZodNativeEnum<typeof CulturalLevel>>;
    rankXP: z.ZodDefault<z.ZodNumber>;
    dialectPreference: z.ZodOptional<z.ZodString>;
    hasOnboarded: z.ZodDefault<z.ZodBoolean>;
    interests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    themeColor: z.ZodOptional<z.ZodString>;
    profileVisibility: z.ZodDefault<z.ZodEnum<["public", "private", "community"]>>;
    templeId: z.ZodOptional<z.ZodString>;
    temple: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        yorubaName: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        logo: z.ZodOptional<z.ZodString>;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "id" | "createdAt" | "rankXP" | "verified" | "hasOnboarded" | "updatedAt"> & {
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: UserRole;
    culturalLevel: CulturalLevel;
    profileVisibility: "public" | "private" | "community";
    password: string;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    interests?: string[] | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}, {
    email: string;
    name: string;
    role: UserRole;
    password: string;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    culturalLevel?: CulturalLevel | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    profileVisibility?: "public" | "private" | "community" | undefined;
    interests?: string[] | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    yorubaName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    avatar: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    verified: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    aboutMe: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    age: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    socialLinks: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<["twitter", "instagram", "website", "other"]>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }, {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }>, "many">>>;
    culturalLevel: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof CulturalLevel>>>;
    rankXP: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    dialectPreference: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    hasOnboarded: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    interests: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    themeColor: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    profileVisibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["public", "private", "community"]>>>;
    templeId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    temple: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        yorubaName: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        logo: z.ZodOptional<z.ZodString>;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }, {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    }>>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "id" | "createdAt" | "email" | "role" | "verified" | "updatedAt">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    culturalLevel?: CulturalLevel | undefined;
    rankXP?: number | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    profileVisibility?: "public" | "private" | "community" | undefined;
    interests?: string[] | undefined;
    hasOnboarded?: boolean | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    yorubaName?: string | undefined;
    avatar?: string | undefined;
    bio?: string | undefined;
    aboutMe?: string | undefined;
    gender?: string | undefined;
    age?: number | undefined;
    location?: string | undefined;
    culturalLevel?: CulturalLevel | undefined;
    rankXP?: number | undefined;
    dialectPreference?: string | undefined;
    themeColor?: string | undefined;
    profileVisibility?: "public" | "private" | "community" | undefined;
    interests?: string[] | undefined;
    hasOnboarded?: boolean | undefined;
    templeId?: string | undefined;
    socialLinks?: {
        platform: "website" | "instagram" | "twitter" | "other";
        url: string;
    }[] | undefined;
    temple?: {
        id: string;
        name: string;
        verified: boolean;
        slug: string;
        yorubaName?: string | undefined;
        logo?: string | undefined;
    } | undefined;
}>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
