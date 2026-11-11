import type { LlmClient } from '@childgpt/safety';
import type { Config } from '../config';
import type { Logger } from '../logger';
import { createMockClient } from './mock';
import { createSiberiClient } from './siberi';

export function createLlmClient(config: Config, logger: Logger): LlmClient {
  if (config.LLM_PROVIDER === 'siberi') {
    return createSiberiClient({ apiKey: config.SIBERI_API_KEY as string, baseUrl: config.SIBERI_BASE_URL, logger });
  }
  return createMockClient();
}
