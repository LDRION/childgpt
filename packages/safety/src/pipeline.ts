import type { SafetyCategory, SafetySeverity } from '@childgpt/shared';
import { judgeInput, judgeOutput, type InputJudgement } from './judge';
import { lumiSystemPrompt } from './prompts';
import { PERSONAL_DATA_NOTE, crisisReply, fallbackReply, redirectReply } from './responses';
import { inspectInput, inspectOutput } from './rules/inspect';
import type {
  ChildContext,
  HistoryTurn,
  LlmClient,
  PipelineAction,
  PipelineResult,
  SafetyEventDraft,
} from './types';

export interface PipelineOptions {
  /**
   * always    — LLM-судья проверяет каждое сообщение ребёнка (по умолчанию);
   * on_signal — только сообщения, на которых сработали правила review/support.
   * Строгий режим ребёнка всегда включает судью.
   */
  inputJudge: 'always' | 'on_signal';
  answerTimeoutMs: number;
  judgeTimeoutMs: number;
  maxReplyChars: number;
  historyTurns: number;
}

const DEFAULTS: PipelineOptions = {
  inputJudge: 'always',
  answerTimeoutMs: 45_000,
  judgeTimeoutMs: 25_000,
  maxReplyChars: 1_200,
  historyTurns: 8,
};

const CRISIS_CATEGORIES = new Set<SafetyCategory>(['crisis_self_harm', 'crisis_abuse', 'contact_stranger', 'extremism', 'violence']);
const LOW_SEVERITY_REDIRECTS = new Set<SafetyCategory>(['profanity', 'jailbreak', 'gambling', 'other']);

export interface ProcessInput {
  child: ChildContext;
  text: string;
  /** Уже показанные ребёнку реплики, старые → новые. Тексты ребёнка — без личных данных. */
  history: HistoryTurn[];
}

function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('\n'));
  return `${(end > max * 0.5 ? cut.slice(0, end + 1) : cut).trim()}…`;
}

export function createSafetyPipeline(llm: LlmClient, options: Partial<PipelineOptions> = {}) {
  const opts: PipelineOptions = { ...DEFAULTS, ...options };

  async function process({ child, text, history }: ProcessInput): Promise<PipelineResult> {
    const startedAt = Date.now();
    const seed = `${child.name}:${text}`;
    const events: SafetyEventDraft[] = [];
    const categories = new Set<SafetyCategory>();

    const finish = (action: PipelineAction, reply: string): PipelineResult => ({
      reply,
      action,
      categories: [...categories],
      sanitizedInput: inspection.sanitized,
      personalDataRedacted: inspection.personalData,
      events,
      timings: { totalMs: Date.now() - startedAt },
    });
    const event = (severity: SafetySeverity, category: SafetyCategory, stage: SafetyEventDraft['stage'], note: string) => {
      categories.add(category);
      events.push({ severity, category, stage, note: note.slice(0, 300) });
    };

    // ── Слой 1–2: нормализация, правила, редакция личных данных ──────────────────
    const previousChild = [...history].reverse().find((t) => t.role === 'child');
    const inspection = inspectInput(text, previousChild?.text);

    if (inspection.personalData) {
      event('info', 'personal_data', 'input_rules', `скрыто: ${inspection.redactions.join(', ')}`);
    }

    const top = inspection.hits[0];
    if (top?.action === 'crisis') {
      event('critical', top.category, 'input_rules', `правило ${top.ruleId}: «${top.match}»`);
      return finish('crisis', crisisReply(top.category, child.gender));
    }
    if (top?.action === 'redirect') {
      event(top.severity, top.category, 'input_rules', `правило ${top.ruleId}: «${top.match}»`);
      return finish('redirected', redirectReply(top.category, seed));
    }

    let mode: 'normal' | 'support' = 'normal';
    for (const hit of inspection.hits) {
      if (hit.action === 'support') {
        mode = 'support';
        event(hit.severity, hit.category, 'input_rules', `правило ${hit.ruleId}: «${hit.match}»`);
      }
    }

    const needInputJudge =
      opts.inputJudge === 'always' || child.strictMode === true || inspection.hits.some((h) => h.action === 'review' || h.action === 'support');

    const turns = history.slice(-opts.historyTurns);
    const generate = (m: 'normal' | 'support') =>
      llm.complete({
        system: lumiSystemPrompt(child, m),
        prompt: inspection.sanitized,
        history: turns,
        timeoutMs: opts.answerTimeoutMs,
        purpose: 'answer',
      });

    // Ответ и проверка входа идут параллельно — экономим время. Ответ всё равно не
    // будет показан, пока его не одобрят правила выхода и судья выхода.
    let answerPromise = generate(mode);
    answerPromise.catch(() => undefined);

    // ── Слой 3: LLM-судья входа ─────────────────────────────────────────────────
    if (needInputJudge) {
      let judgement: InputJudgement;
      try {
        judgement = await judgeInput(llm, inspection.sanitized, child.age, opts.judgeTimeoutMs);
      } catch (err) {
        event('info', 'system_error', 'pipeline_error', `судья входа недоступен: ${(err as Error).message}`);
        return finish('fallback', fallbackReply(seed));
      }

      if (judgement.verdict === 'crisis') {
        const category = CRISIS_CATEGORIES.has(judgement.category) ? judgement.category : 'crisis_self_harm';
        event('critical', category, 'input_judge', judgement.reason);
        return finish('crisis', crisisReply(category, child.gender));
      }
      if (judgement.verdict === 'redirect') {
        event(LOW_SEVERITY_REDIRECTS.has(judgement.category) ? 'info' : 'warning', judgement.category, 'input_judge', judgement.reason);
        return finish('redirected', redirectReply(judgement.category, seed));
      }
      if (judgement.verdict === 'support' && mode === 'normal') {
        mode = 'support';
        event('warning', judgement.category === 'other' ? 'bullying' : judgement.category, 'input_judge', judgement.reason);
        answerPromise = generate('support');
        answerPromise.catch(() => undefined);
      }
    }

    // ── Слой 4: ответ модели ────────────────────────────────────────────────────
    let raw: string;
    try {
      raw = await answerPromise;
    } catch (err) {
      event('info', 'system_error', 'pipeline_error', `модель недоступна: ${(err as Error).message}`);
      return finish('fallback', fallbackReply(seed));
    }

    // ── Слой 5: правила выхода (очистка + стоп-слова) ───────────────────────────
    // Ответ модели отклонён — это не поступок ребёнка, поэтому событие только «для
    // сведения»: родителя не тревожим, но в журнале видно, что защита сработала.
    const out = inspectOutput(raw);
    if (out.blocked) {
      const hit = out.hits[0];
      event('info', hit?.category ?? 'other', 'output_rules', hit ? `правило ${hit.ruleId}: «${hit.match}»` : 'пустой ответ');
      return finish('fallback', fallbackReply(seed));
    }
    const reply = truncateAtSentence(out.text, opts.maxReplyChars);

    // ── Слой 6: LLM-судья выхода (обязателен всегда) ────────────────────────────
    try {
      const verdict = await judgeOutput(llm, inspection.sanitized, reply, child.age, opts.judgeTimeoutMs);
      if (!verdict.safe) {
        event('info', verdict.category, 'output_judge', verdict.reason || 'ответ отклонён судьёй');
        return finish('fallback', fallbackReply(seed));
      }
    } catch (err) {
      event('info', 'system_error', 'pipeline_error', `судья выхода недоступен: ${(err as Error).message}`);
      return finish('fallback', fallbackReply(seed));
    }

    return finish('allowed', inspection.personalData ? `${reply}${PERSONAL_DATA_NOTE}` : reply);
  }

  return { process, options: opts };
}

export type SafetyPipeline = ReturnType<typeof createSafetyPipeline>;
