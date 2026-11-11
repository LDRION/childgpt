import type { LlmClient, LlmRequest } from '@childgpt/safety';
import type { Logger } from '../logger';

// Клиент Siberi AI (siberi.online/api/v1/ai). Синхронный режим POST /generate {wait:true}:
// сервер Siberi сам поллит задачу и возвращает результат одним ответом — без клиентского
// поллинга с паузами (тот же подход, что в hhpilot/lib/siberiClient.ts).
//
// Стриминг (partialResult) здесь сознательно НЕ используется: ребёнку показывается
// только полностью проверенный ответ.

interface SiberiOptions {
  apiKey: string;
  baseUrl: string;
  logger: Logger;
}

// Провайдер под нагрузкой иногда отдаёт текст-ошибку вместо ответа — это сбой, не ответ.
function isProviderErrorText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/не удалось (?:создать|сгенерировать|получить) ответ/i.test(t)) return true;
  if (/Искусственному интеллекту не удалось/i.test(t)) return true;
  return t.length < 160 && /(?:^|[\s—-])Что-то пошло не так/i.test(t);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createSiberiClient({ apiKey, baseUrl, logger }: SiberiOptions): LlmClient {
  async function complete({ system, prompt, history, timeoutMs = 45_000, purpose }: LlmRequest): Promise<string> {
    const body = {
      system,
      prompt,
      wait: true,
      timeoutMs,
      history: history?.map((t) => ({ role: t.role === 'child' ? 'user' : 'assistant', content: t.text })),
    };

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs + 5_000);
      const startedAt = Date.now();
      try {
        const res = await fetch(`${baseUrl}/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (res.status === 429 && attempt < 3) {
          logger.warn({ purpose, attempt }, 'siberi rate limited');
          await sleep(1_500 * attempt);
          continue;
        }
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Siberi ${res.status} ${text.slice(0, 200)}`);
        }

        const data = (await res.json()) as { result?: string; error?: string };
        if (data.error) throw new Error(`Siberi: ${data.error}`);
        const result = (data.result ?? '').trim();
        if (isProviderErrorText(result)) throw new Error('Siberi: провайдер вернул ошибку генерации');
        logger.debug({ purpose, ms: Date.now() - startedAt }, 'siberi ok');
        return result;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('Siberi: превышен лимит запросов');
  }

  return { complete };
}
