import type { ThemeId } from './themes';

export type SafetyCategory =
  | 'crisis_self_harm'
  | 'crisis_abuse'
  | 'contact_stranger'
  | 'bullying'
  | 'sexual'
  | 'violence'
  | 'weapons'
  | 'drugs'
  | 'alcohol_tobacco'
  | 'extremism'
  | 'hate'
  | 'profanity'
  | 'gambling'
  | 'dangerous_activity'
  | 'medical'
  | 'scary'
  | 'personal_data'
  | 'jailbreak'
  | 'off_platform'
  | 'other'
  | 'system_error';

export type SafetySeverity = 'info' | 'warning' | 'critical';

/**
 * Где сработала защита. Порядок соответствует порядку слоёв в конвейере.
 */
export type SafetyStage =
  | 'input_rules'
  | 'input_judge'
  | 'output_rules'
  | 'output_judge'
  | 'pipeline_error'
  | 'limits';

export type MessageRole = 'child' | 'lumi';

export interface ParentDTO {
  id: string;
  email: string;
  name: string;
  hasPin: boolean;
  notifyByEmail: boolean;
  createdAt: string;
}

export interface ChildDTO {
  id: string;
  name: string;
  birthYear: number;
  age: number;
  gender: 'boy' | 'girl';
  theme: ThemeId;
  dailyMessageLimit: number;
  strictMode: boolean;
  createdAt: string;
}

export interface KidProfileDTO {
  id: string;
  name: string;
  age: number;
  theme: ThemeId;
}

export interface MessageDTO {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
  /** Видно только родителю: что сделала защита с этим сообщением. */
  safety?: {
    action: 'allowed' | 'redirected' | 'crisis' | 'fallback';
    categories: SafetyCategory[];
    redactedPersonalData: boolean;
  };
}

export interface ConversationDTO {
  id: string;
  day: string;
  messageCount: number;
  flagged: boolean;
  lastMessageAt: string;
}

export interface SafetyEventDTO {
  id: string;
  childId: string;
  childName: string;
  conversationId: string | null;
  severity: SafetySeverity;
  category: SafetyCategory;
  stage: SafetyStage;
  excerpt: string;
  reviewed: boolean;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
  fields?: Record<string, string>;
}
