import { z } from "zod";
import {
  WATCHDOG_STATUSES,
  WATCHDOG_SERVICE_TYPES,
  WATCHDOG_CHECK_TYPES,
} from "../constants.js";

export const watchdogStatusSchema = z.enum(WATCHDOG_STATUSES);
export const watchdogServiceTypeSchema = z.enum(WATCHDOG_SERVICE_TYPES);
export const watchdogCheckTypeSchema = z.enum(WATCHDOG_CHECK_TYPES);

const serviceConfigSchema = z.object({
  serviceName: z.string().min(1),
  pidFile: z.string().optional(),
  heartbeatFile: z.string().optional(),
  logPaths: z.array(z.string()).optional(),
  restartCommand: z.string().min(1),
  cwd: z.string().min(1),
  healthCheckCommand: z.string().optional(),
  stallThresholdMinutes: z.number().int().positive().optional(),
  errorRateThreshold: z.number().int().positive().optional(),
  errorRateWindowMinutes: z.number().int().positive().optional(),
});

export const createWatchdogTargetSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid(),
  name: z.string().min(1).max(200),
  serviceType: watchdogServiceTypeSchema,
  serviceConfig: serviceConfigSchema,
  status: watchdogStatusSchema.optional().default("active"),
});
export type CreateWatchdogTarget = z.infer<typeof createWatchdogTargetSchema>;

export const updateWatchdogTargetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  serviceType: watchdogServiceTypeSchema.optional(),
  serviceConfig: serviceConfigSchema.optional(),
  status: watchdogStatusSchema.optional(),
  projectId: z.string().uuid().optional().nullable(),
});
export type UpdateWatchdogTarget = z.infer<typeof updateWatchdogTargetSchema>;

export const reportCheckResultSchema = z.object({
  checkType: watchdogCheckTypeSchema,
  status: z.enum(["healthy", "warning", "critical"]),
  details: z.string(),
  metrics: z.record(z.number()).optional(),
});
export type ReportCheckResult = z.infer<typeof reportCheckResultSchema>;
