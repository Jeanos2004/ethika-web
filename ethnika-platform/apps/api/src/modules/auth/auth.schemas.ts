import { z } from "zod";

export const loginInput = z.strictObject({ email: z.email().max(200), password: z.string().min(1).max(200) });
export const mfaInput = z.strictObject({ challenge: z.string().min(20).max(100), code: z.string().regex(/^\d{6}$/) });
export const codeInput = z.strictObject({ code: z.string().regex(/^\d{6}$/) });
export const passwordInput = z.strictObject({ current: z.string().min(1).max(200), next: z.string().min(1).max(200) });

export const userCreate = z.strictObject({ email: z.email().max(200), name: z.string().trim().min(2).max(120), role: z.enum(["admin", "agent"]) });
export const userUpdate = z.strictObject({ name: z.string().trim().min(2).max(120).optional(), role: z.enum(["admin", "agent"]).optional(), disabled: z.boolean().optional() });
export const pageInput = z.strictObject({ page: z.coerce.number().int().min(1).max(10_000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(50) });
