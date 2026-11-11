import pino from 'pino';

// Тексты детских сообщений в логи не пишем никогда — только идентификаторы и метки.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.password', '*.pin', '*.text'],
    censor: '[скрыто]',
  },
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } : undefined,
});

export type Logger = typeof logger;
