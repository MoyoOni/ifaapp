"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAppointmentSchema = exports.CreateAppointmentSchema = exports.AppointmentSchema = void 0;
const zod_1 = require("zod");
exports.AppointmentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    babalawoId: zod_1.z.string().uuid(),
    clientId: zod_1.z.string().uuid(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    timezone: zod_1.z.string().default('Africa/Lagos'),
    duration: zod_1.z.number().int().positive().default(60),
    status: zod_1.z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED', 'IN_SESSION']),
    price: zod_1.z.number().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
    cancelledAt: zod_1.z.date().optional(),
    cancelledBy: zod_1.z.string().uuid().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateAppointmentSchema = exports.AppointmentSchema.omit({
    id: true,
    clientId: true,
    status: true,
    cancelledAt: true,
    cancelledBy: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateAppointmentSchema = exports.AppointmentSchema.partial().omit({
    id: true,
    babalawoId: true,
    clientId: true,
    createdAt: true
});
//# sourceMappingURL=appointment.schema.js.map