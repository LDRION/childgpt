import type { ErrorRequestHandler } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { logger } from '../logger';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code?: string) => new HttpError(400, message, code);
export const unauthorized = (message = 'Нужно войти в аккаунт') => new HttpError(401, message, 'unauthorized');
export const forbidden = (message = 'Нет доступа') => new HttpError(403, message, 'forbidden');
export const notFound = (message = 'Не найдено') => new HttpError(404, message, 'not_found');
export const conflict = (message: string, code?: string) => new HttpError(409, message, code);

export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw zodToHttp(result.error);
  return result.data;
}

function zodToHttp(err: ZodError): HttpError {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return new HttpError(400, 'Проверьте заполнение полей', 'validation', fields);
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) err = zodToHttp(err);
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code, fields: err.fields });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Слишком большой запрос', code: 'too_large' });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некорректный JSON', code: 'bad_json' });
    return;
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'Что-то пошло не так. Попробуйте ещё раз.', code: 'internal' });
};
