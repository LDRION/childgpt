import type { SafetyCategory } from '@childgpt/shared';
import { INPUT_JUDGE_SYSTEM, OUTPUT_JUDGE_SYSTEM, inputJudgePrompt, outputJudgePrompt } from './prompts';
import type { LlmClient } from './types';

const CATEGORIES = new Set<SafetyCategory>([
  'crisis_self_harm',
  'crisis_abuse',
  'contact_stranger',
  'bullying',
  'sexual',
  'violence',
  'weapons',
  'drugs',
  'alcohol_tobacco',
  'extremism',
  'hate',
  'profanity',
  'gambling',
  'dangerous_activity',
  'medical',
  'scary',
  'personal_data',
  'jailbreak',
  'off_platform',
  'other',
]);

export class JudgeError extends Error {}

/** Достаёт первый JSON-объект из ответа модели (модели любят оборачивать его в ```json). */
export function extractJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{');
  if (start === -1) throw new JudgeError('judge: нет JSON в ответе');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          const parsed: unknown = JSON.parse(raw.slice(start, i + 1));
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
        } catch {
          break;
        }
      }
    }
  }
  throw new JudgeError('judge: не удалось разобрать JSON');
}

function toCategory(value: unknown): SafetyCategory {
  return typeof value === 'string' && CATEGORIES.has(value as SafetyCategory) ? (value as SafetyCategory) : 'other';
}

export type InputVerdict = 'allow' | 'redirect' | 'support' | 'crisis';

export interface InputJudgement {
  verdict: InputVerdict;
  category: SafetyCategory;
  reason: string;
}

export interface OutputJudgement {
  safe: boolean;
  category: SafetyCategory;
  reason: string;
}

export async function judgeInput(llm: LlmClient, text: string, age: number, timeoutMs: number): Promise<InputJudgement> {
  const raw = await llm.complete({
    system: INPUT_JUDGE_SYSTEM,
    prompt: inputJudgePrompt(text, age),
    timeoutMs,
    purpose: 'judge_input',
  });
  const json = extractJson(raw);
  const verdict = json.verdict;
  if (verdict !== 'allow' && verdict !== 'redirect' && verdict !== 'support' && verdict !== 'crisis') {
    throw new JudgeError(`judge_input: неизвестный verdict ${String(verdict)}`);
  }
  return { verdict, category: toCategory(json.category), reason: String(json.reason ?? '').slice(0, 200) };
}

export async function judgeOutput(
  llm: LlmClient,
  question: string,
  answer: string,
  age: number,
  timeoutMs: number,
): Promise<OutputJudgement> {
  const raw = await llm.complete({
    system: OUTPUT_JUDGE_SYSTEM,
    prompt: outputJudgePrompt(question, answer, age),
    timeoutMs,
    purpose: 'judge_output',
  });
  const json = extractJson(raw);
  // Только явное булево true считается «безопасно». "true" строкой, 1, отсутствие поля — нет.
  return { safe: json.safe === true, category: toCategory(json.category), reason: String(json.reason ?? '').slice(0, 200) };
}
