"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBabalawoClientSchema = exports.BabalawoClientSchema = void 0;
const zod_1 = require("zod");
exports.BabalawoClientSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    babalawoId: zod_1.z.string().uuid(),
    clientId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'CHANGED']),
    assignedAt: zod_1.z.date(),
    changedAt: zod_1.z.date().optional(),
    notes: zod_1.z.string().optional()
});
exports.CreateBabalawoClientSchema = exports.BabalawoClientSchema.omit({
    id: true,
    status: true,
    assignedAt: true,
    changedAt: true
});
//# sourceMappingURL=babalawo-client.schema.js.map