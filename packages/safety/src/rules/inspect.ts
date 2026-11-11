import type { SafetyCategory } from '@childgpt/shared';
import { normalizeVariants } from '../normalize';
import type { Rule, RuleAction, RuleHit } from '../types';
import { RULES } from './lexicon';
import { isPersonalData, redactPersonalData, sanitizeModelOutput, type RedactionKind } from './personal-data';

const ACTION_PRIORITY: Record<RuleAction, number> = { crisis: 5, block: 4, redirect: 3, support: 2, review: 1 };

function matchRules(text: string, scope: 'input' | 'output', rules: Rule[] = RULES): RuleHit[] {
  const variants = normalizeVariants(text);
  const hits: RuleHit[] = [];
  for (const rule of rules) {
    if (rule.scope !== scope && rule.scope !== 'both') continue;
    for (const pattern of rule.patterns) {
      let found: string | null = null;
      for (const v of variants) {
        const m = pattern.exec(v);
        if (m) {
          found = m[0];
          break;
        }
      }
      if (found !== null) {
        hits.push({ ruleId: rule.id, category: rule.category, action: rule.action, severity: rule.severity, match: found });
        break;
      }
    }
  }
  return hits.sort((a, b) => ACTION_PRIORITY[b.action] - ACTION_PRIORITY[a.action]);
}

export interface InputInspection {
  /** Текст без личных данных и ссылок — именно он уходит в модель. */
  sanitized: string;
  redactions: RedactionKind[];
  personalData: boolean;
  hits: RuleHit[];
  /** Самое строгое действие среди сработавших правил. */
  topAction: RuleAction | null;
  categories: SafetyCategory[];
}

export function inspectInput(text: string, previousChildText?: string): InputInspection {
  const { text: sanitized, kinds } = redactPersonalData(text);
  const hits = matchRules(text, 'input');

  // Кризисные фразы иногда разбиты на два сообщения («я хочу» / «умереть»).
  if (previousChildText && !hits.some((h) => h.action === 'crisis')) {
    const joined = matchRules(`${previousChildText} ${text}`, 'input').filter((h) => h.action === 'crisis');
    hits.unshift(...joined);
  }

  return {
    sanitized,
    redactions: kinds,
    personalData: kinds.some(isPersonalData),
    hits,
    topAction: hits[0]?.action ?? null,
    categories: [...new Set(hits.map((h) => h.category))],
  };
}

export interface OutputInspection {
  text: string;
  removed: RedactionKind[];
  hits: RuleHit[];
  blocked: boolean;
}

export function inspectOutput(raw: string): OutputInspection {
  const { text, removed } = sanitizeModelOutput(raw);
  const hits = matchRules(text, 'output');
  // Для ответа модели любое сработавшее правило = ответ не показываем.
  const blocked = hits.length > 0 || text.trim().length === 0;
  return { text, removed, hits, blocked };
}
