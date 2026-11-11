import type { ChildDTO, ConversationDTO, KidProfileDTO, MessageDTO, ParentDTO, SafetyCategory, SafetyEventDTO } from '@childgpt/shared';
import type { ChildDoc, ConversationDoc, MessageDoc, ParentDoc, SafetyEventDoc } from '../models';

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return Math.max(0, now.getFullYear() - birthYear);
}

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : new Date(0).toISOString());

export function parentDTO(p: ParentDoc): ParentDTO {
  return {
    id: String(p._id),
    email: p.email,
    name: p.name,
    hasPin: Boolean(p.pinHash),
    notifyByEmail: p.notifyByEmail,
    createdAt: iso(p.createdAt),
  };
}

export function childDTO(c: ChildDoc): ChildDTO {
  return {
    id: String(c._id),
    name: c.name,
    birthYear: c.birthYear,
    age: ageFromBirthYear(c.birthYear),
    gender: c.gender,
    theme: c.theme,
    dailyMessageLimit: c.dailyMessageLimit,
    strictMode: c.strictMode,
    createdAt: iso(c.createdAt),
  };
}

export function kidProfileDTO(c: ChildDoc): KidProfileDTO {
  return { id: String(c._id), name: c.name, age: ageFromBirthYear(c.birthYear), theme: c.theme };
}

/** Для родителя — с метками защиты; для ребёнка — без них. */
export function messageDTO(m: MessageDoc, audience: 'parent' | 'kid'): MessageDTO {
  const base: MessageDTO = { id: String(m._id), role: m.role, text: m.text, createdAt: iso(m.createdAt) };
  if (audience === 'kid') return base;
  return {
    ...base,
    safety: {
      action: m.safety?.action ?? 'allowed',
      categories: (m.safety?.categories ?? []) as SafetyCategory[],
      redactedPersonalData: Boolean(m.safety?.redactedPersonalData),
    },
  };
}

export function conversationDTO(c: ConversationDoc): ConversationDTO {
  return { id: String(c._id), day: c.day, messageCount: c.messageCount, flagged: c.flagged, lastMessageAt: iso(c.lastMessageAt) };
}

export function safetyEventDTO(e: SafetyEventDoc, childName: string): SafetyEventDTO {
  return {
    id: String(e._id),
    childId: String(e.childId),
    childName,
    conversationId: e.conversationId ? String(e.conversationId) : null,
    severity: e.severity,
    category: e.category as SafetyCategory,
    stage: e.stage as SafetyEventDTO['stage'],
    excerpt: e.excerpt,
    reviewed: Boolean(e.reviewedAt),
    createdAt: iso(e.createdAt),
  };
}
