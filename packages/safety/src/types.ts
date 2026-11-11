import type { SafetyCategory, SafetySeverity, SafetyStage } from '@childgpt/shared';

export type Gender = 'boy' | 'girl';

/**
 * Что делает правило при срабатывании.
 * - crisis   — детерминированный кризисный ответ (телефон доверия), модель не вызывается
 * - redirect — детерминированный мягкий отказ с переводом темы, модель не вызывается
 * - support  — ответ модели в режиме «поддержка» + сигнал родителю
 * - review   — тема неоднозначна: обязателен LLM-судья входа, даже если он выключен
 * - block    — (только для ответа модели) ответ не показывается, отдаётся безопасная заглушка
 */
export type RuleAction = 'crisis' | 'redirect' | 'support' | 'review' | 'block';

export interface Rule {
  id: string;
  category: SafetyCategory;
  action: RuleAction;
  severity: SafetySeverity;
  scope: 'input' | 'output' | 'both';
  patterns: RegExp[];
}

export interface RuleHit {
  ruleId: string;
  category: SafetyCategory;
  action: RuleAction;
  severity: SafetySeverity;
  match: string;
}

export interface ChildContext {
  name: string;
  age: number;
  gender: Gender;
  strictMode?: boolean;
}

export interface HistoryTurn {
  role: 'child' | 'lumi';
  text: string;
}

export interface LlmRequest {
  system: string;
  prompt: string;
  history?: HistoryTurn[];
  timeoutMs?: number;
  /** Пометка для логов/метрик: что за вызов. */
  purpose: 'answer' | 'judge_input' | 'judge_output';
}

export interface LlmClient {
  complete(req: LlmRequest): Promise<string>;
}

export interface SafetyEventDraft {
  severity: SafetySeverity;
  category: SafetyCategory;
  stage: SafetyStage;
  note: string;
}

export type PipelineAction = 'allowed' | 'redirected' | 'crisis' | 'fallback';

export interface PipelineResult {
  reply: string;
  action: PipelineAction;
  categories: SafetyCategory[];
  /** Текст, который реально ушёл в модель (без личных данных). */
  sanitizedInput: string;
  personalDataRedacted: boolean;
  events: SafetyEventDraft[];
  timings: { totalMs: number };
}
