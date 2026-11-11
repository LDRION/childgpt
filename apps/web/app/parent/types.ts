import type { ChildDTO, SafetyEventDTO } from '@childgpt/shared';

export interface OverviewChild extends ChildDTO {
  todayMessages: number;
  unreviewedAlerts: number;
  unreviewedCritical: number;
}

export interface OverviewResponse {
  children: OverviewChild[];
  events: SafetyEventDTO[];
}
