import type {
  LearningEventTriggerType,
  LearningEventDeviationMagnitude,
  LearningEventStatus,
} from "../constants.js";

export interface LearningEvent {
  id: string;
  companyId: string;
  triggerType: LearningEventTriggerType;
  packetId: string | null;
  sourceAgentId: string | null;
  targetAgentIds: string[] | null;
  expectedOutcome: string | null;
  actualOutcome: string | null;
  deviationMagnitude: LearningEventDeviationMagnitude | null;
  retroIssueId: string | null;
  constraintText: string | null;
  status: LearningEventStatus;
  createdAt: Date;
  updatedAt: Date;
}
