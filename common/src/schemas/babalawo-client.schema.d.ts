import { z } from 'zod';
export declare const BabalawoClientSchema: z.ZodObject<{
    id: z.ZodString;
    babalawoId: z.ZodString;
    clientId: z.ZodString;
    status: z.ZodEnum<["ACTIVE", "INACTIVE", "CHANGED"]>;
    assignedAt: z.ZodDate;
    changedAt: z.ZodOptional<z.ZodDate>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "ACTIVE" | "INACTIVE" | "CHANGED";
    babalawoId: string;
    clientId: string;
    assignedAt: Date;
    notes?: string | undefined;
    changedAt?: Date | undefined;
}, {
    id: string;
    status: "ACTIVE" | "INACTIVE" | "CHANGED";
    babalawoId: string;
    clientId: string;
    assignedAt: Date;
    notes?: string | undefined;
    changedAt?: Date | undefined;
}>;
export type BabalawoClient = z.infer<typeof BabalawoClientSchema>;
export declare const CreateBabalawoClientSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    babalawoId: z.ZodString;
    clientId: z.ZodString;
    status: z.ZodEnum<["ACTIVE", "INACTIVE", "CHANGED"]>;
    assignedAt: z.ZodDate;
    changedAt: z.ZodOptional<z.ZodDate>;
    notes: z.ZodOptional<z.ZodString>;
}, "id" | "status" | "assignedAt" | "changedAt">, "strip", z.ZodTypeAny, {
    babalawoId: string;
    clientId: string;
    notes?: string | undefined;
}, {
    babalawoId: string;
    clientId: string;
    notes?: string | undefined;
}>;
export type CreateBabalawoClientDto = z.infer<typeof CreateBabalawoClientSchema>;
