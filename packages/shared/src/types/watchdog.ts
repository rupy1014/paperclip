import type {
  WatchdogStatus,
  WatchdogServiceType,
  WatchdogRecoveryLevel,
  WatchdogCheckType,
} from "../constants.js";

export interface WatchdogServiceConfig {
  serviceName: string;
  pidFile?: string;
  heartbeatFile?: string;
  logPaths?: string[];
  restartCommand: string;
  cwd: string;
  healthCheckCommand?: string;
  stallThresholdMinutes?: number;
  errorRateThreshold?: number;
  errorRateWindowMinutes?: number;
}

export interface WatchdogTarget {
  id: string;
  companyId: string;
  projectId: string | null;
  agentId: string;
  name: string;
  serviceType: WatchdogServiceType;
  serviceConfig: WatchdogServiceConfig;
  status: WatchdogStatus;
  currentRecoveryLevel: WatchdogRecoveryLevel;
  consecutiveFailures: number;
  lastHealthyAt: Date | null;
  lastIncidentAt: Date | null;
  lastRecoveryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchdogCheckResult {
  checkType: WatchdogCheckType;
  status: "healthy" | "warning" | "critical";
  details: string;
  metrics?: Record<string, number>;
}
