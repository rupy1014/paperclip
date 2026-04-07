import { z } from "zod";
import {
  LEARNING_EVENT_TRIGGER_TYPES,
  LEARNING_EVENT_DEVIATION_MAGNITUDES,
  LEARNING_EVENT_STATUSES,
} from "../constants.js";

export const learningEventTriggerTypeSchema = z.enum(LEARNING_EVENT_TRIGGER_TYPES);
export const learningEventDeviationMagnitudeSchema = z.enum(LEARNING_EVENT_DEVIATION_MAGNITUDES);
export const learningEventStatusSchema = z.enum(LEARNING_EVENT_STATUSES);

export const createLearningEventSchema = z.object({
  triggerType: learningEventTriggerTypeSchema,
  packetId: z.string().uuid().optional().nullable(),
  sourceAgentId: z.string().uuid().optional().nullable(),
  targetAgentIds: z.array(z.string().uuid()).optional().nullable(),
  expectedOutcome: z.string().max(5000).optional().nullable(),
  actualOutcome: z.string().max(5000).optional().nullable(),
  deviationMagnitude: learningEventDeviationMagnitudeSchema.optional().nullable(),
  constraintText: z.string().max(5000).optional().nullable(),
});
export type CreateLearningEvent = z.infer<typeof createLearningEventSchema>;

export const updateLearningEventStatusSchema = z.object({
  status: learningEventStatusSchema,
});
export type UpdateLearningEventStatus = z.infer<typeof updateLearningEventStatusSchema>;
