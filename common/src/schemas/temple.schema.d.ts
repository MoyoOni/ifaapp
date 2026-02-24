import { z } from 'zod';
import { TempleType, TempleStatus } from '../enums/temple.enum.js';
export declare const TempleSocialLinksSchema: z.ZodObject<{
    facebook: z.ZodOptional<z.ZodString>;
    instagram: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    youtube: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    website?: string | undefined;
    facebook?: string | undefined;
    instagram?: string | undefined;
    twitter?: string | undefined;
    youtube?: string | undefined;
}, {
    website?: string | undefined;
    facebook?: string | undefined;
    instagram?: string | undefined;
    twitter?: string | undefined;
    youtube?: string | undefined;
}>;
export declare const CoordinatesSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export declare const TempleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    yorubaName: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    history: z.ZodOptional<z.ZodString>;
    mission: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    bannerImage: z.ZodOptional<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    founderId: z.ZodOptional<z.ZodString>;
    foundedYear: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TempleStatus>>;
    verified: z.ZodDefault<z.ZodBoolean>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    verifiedBy: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof TempleType>>;
    lineage: z.ZodOptional<z.ZodString>;
    tradition: z.ZodOptional<z.ZodString>;
    specialties: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodString>;
        instagram: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        youtube: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }>>;
    babalawoCount: z.ZodDefault<z.ZodNumber>;
    clientCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    name: string;
    verified: boolean;
    updatedAt: Date;
    type: TempleType;
    status: TempleStatus;
    slug: string;
    country: string;
    images: string[];
    specialties: string[];
    babalawoCount: number;
    clientCount: number;
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    verifiedAt?: Date | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    verified?: boolean | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    type?: TempleType | undefined;
    status?: TempleStatus | undefined;
    verifiedAt?: Date | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    images?: string[] | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    specialties?: string[] | undefined;
    babalawoCount?: number | undefined;
    clientCount?: number | undefined;
}>;
export type Temple = z.infer<typeof TempleSchema>;
export type TempleSocialLinks = z.infer<typeof TempleSocialLinksSchema>;
export type Coordinates = z.infer<typeof CoordinatesSchema>;
export declare const CreateTempleSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    yorubaName: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodString>;
        instagram: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        youtube: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }>>;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof TempleType>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TempleStatus>>;
    history: z.ZodOptional<z.ZodString>;
    mission: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    phone: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    bannerImage: z.ZodOptional<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    founderId: z.ZodOptional<z.ZodString>;
    foundedYear: z.ZodOptional<z.ZodNumber>;
    lineage: z.ZodOptional<z.ZodString>;
    tradition: z.ZodOptional<z.ZodString>;
    specialties: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
} & {
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: TempleType;
    status: TempleStatus;
    slug: string;
    country: string;
    images: string[];
    specialties: string[];
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
}, {
    name: string;
    slug: string;
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    type?: TempleType | undefined;
    status?: TempleStatus | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    images?: string[] | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    specialties?: string[] | undefined;
}>;
export type CreateTempleDto = z.infer<typeof CreateTempleSchema>;
export declare const UpdateTempleSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    yorubaName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    history: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mission: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    coordinates: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    logo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bannerImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    images: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    founderId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    foundedYear: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TempleStatus>>>;
    verified: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    verifiedAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    verifiedBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TempleType>>>;
    lineage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tradition: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    specialties: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    socialLinks: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodString>;
        instagram: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        youtube: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }>>>;
    babalawoCount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    clientCount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "id" | "createdAt" | "updatedAt" | "founderId" | "babalawoCount" | "clientCount">, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    verified?: boolean | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    type?: TempleType | undefined;
    status?: TempleStatus | undefined;
    verifiedAt?: Date | undefined;
    slug?: string | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    images?: string[] | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    specialties?: string[] | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    verified?: boolean | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    description?: string | undefined;
    type?: TempleType | undefined;
    status?: TempleStatus | undefined;
    verifiedAt?: Date | undefined;
    slug?: string | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    images?: string[] | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    specialties?: string[] | undefined;
}>;
export type UpdateTempleDto = z.infer<typeof UpdateTempleSchema>;
export declare const TempleWithRelationsSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    yorubaName: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    history: z.ZodOptional<z.ZodString>;
    mission: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    bannerImage: z.ZodOptional<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    founderId: z.ZodOptional<z.ZodString>;
    foundedYear: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TempleStatus>>;
    verified: z.ZodDefault<z.ZodBoolean>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    verifiedBy: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof TempleType>>;
    lineage: z.ZodOptional<z.ZodString>;
    tradition: z.ZodOptional<z.ZodString>;
    specialties: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodString>;
        instagram: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        youtube: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }, {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    }>>;
    babalawoCount: z.ZodDefault<z.ZodNumber>;
    clientCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
} & {
    founder: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        yorubaName: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
    }, {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
    }>>;
    babalawos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        yorubaName: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        verified: z.ZodBoolean;
        bio: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        culturalLevel: z.ZodOptional<z.ZodString>;
        certificates: z.ZodOptional<z.ZodArray<z.ZodObject<{
            tier: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tier: string;
        }, {
            tier: string;
        }>, "many">>;
        verificationApps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            tier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currentStage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            currentStage: string;
            tier?: string | null | undefined;
        }, {
            currentStage: string;
            tier?: string | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
        bio?: string | undefined;
        location?: string | undefined;
        culturalLevel?: string | undefined;
        certificates?: {
            tier: string;
        }[] | undefined;
        verificationApps?: {
            currentStage: string;
            tier?: string | null | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
        bio?: string | undefined;
        location?: string | undefined;
        culturalLevel?: string | undefined;
        certificates?: {
            tier: string;
        }[] | undefined;
        verificationApps?: {
            currentStage: string;
            tier?: string | null | undefined;
        }[] | undefined;
    }>, "many">>;
    _count: z.ZodOptional<z.ZodObject<{
        babalawos: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        babalawos: number;
    }, {
        babalawos: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    name: string;
    verified: boolean;
    updatedAt: Date;
    type: TempleType;
    status: TempleStatus;
    slug: string;
    country: string;
    images: string[];
    specialties: string[];
    babalawoCount: number;
    clientCount: number;
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    _count?: {
        babalawos: number;
    } | undefined;
    description?: string | undefined;
    verifiedAt?: Date | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    babalawos?: {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
        bio?: string | undefined;
        location?: string | undefined;
        culturalLevel?: string | undefined;
        certificates?: {
            tier: string;
        }[] | undefined;
        verificationApps?: {
            currentStage: string;
            tier?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    founder?: {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    name: string;
    updatedAt: Date;
    slug: string;
    email?: string | undefined;
    yorubaName?: string | undefined;
    location?: string | undefined;
    verified?: boolean | undefined;
    socialLinks?: {
        website?: string | undefined;
        facebook?: string | undefined;
        instagram?: string | undefined;
        twitter?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    _count?: {
        babalawos: number;
    } | undefined;
    description?: string | undefined;
    type?: TempleType | undefined;
    status?: TempleStatus | undefined;
    verifiedAt?: Date | undefined;
    history?: string | undefined;
    mission?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    logo?: string | undefined;
    bannerImage?: string | undefined;
    images?: string[] | undefined;
    founderId?: string | undefined;
    foundedYear?: number | undefined;
    verifiedBy?: string | undefined;
    lineage?: string | undefined;
    tradition?: string | undefined;
    specialties?: string[] | undefined;
    babalawoCount?: number | undefined;
    clientCount?: number | undefined;
    babalawos?: {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
        bio?: string | undefined;
        location?: string | undefined;
        culturalLevel?: string | undefined;
        certificates?: {
            tier: string;
        }[] | undefined;
        verificationApps?: {
            currentStage: string;
            tier?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    founder?: {
        id: string;
        name: string;
        verified: boolean;
        yorubaName?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
}>;
export type TempleWithRelations = z.infer<typeof TempleWithRelationsSchema>;
