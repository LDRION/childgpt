import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Config } from '../config';
import { forbidden, unauthorized } from '../http/errors';
import { Child, Parent, type ChildDoc, type ParentDoc } from '../models';
import { KID_COOKIE, PARENT_COOKIE, verifyToken } from './tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      parent?: ParentDoc;
      child?: ChildDoc;
    }
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function originOf(req: Request): string | null {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * CSRF-защита: изменяющие запросы с чужого Origin отклоняются всегда; запросы,
 * авторизованные cookie, обязаны прийти с разрешённого Origin. Приложение ходит с
 * Bearer-токеном и без Origin — его это не касается.
 */
export function originGuard(config: Config): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !config.webOrigins.includes(origin)) return next(forbidden('Запрос с неразрешённого адреса'));
    next();
  };
}

function bearer(req: Request): string | null {
  const h = req.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() || null : null;
}

function readToken(req: Request, cookie: string, config: Config): string | null {
  const fromHeader = bearer(req);
  if (fromHeader) return fromHeader;
  const fromCookie = (req.cookies as Record<string, string> | undefined)?.[cookie];
  if (!fromCookie) return null;
  if (!SAFE_METHODS.has(req.method)) {
    const origin = originOf(req);
    if (!origin || !config.webOrigins.includes(origin)) throw forbidden('Запрос с неразрешённого адреса');
  }
  return fromCookie;
}

export function requireParent(config: Config): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = readToken(req, PARENT_COOKIE, config);
    if (!token) throw unauthorized();
    const claims = await verifyToken(config.AUTH_SECRET, token);
    if (!claims || claims.typ !== 'parent') throw unauthorized();
    const parent = await Parent.findById(claims.sub);
    if (!parent || parent.tokenVersion !== claims.ver) throw unauthorized('Сессия истекла, войдите снова');
    req.parent = parent;
    next();
  };
}

export function requireKid(config: Config): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = readToken(req, KID_COOKIE, config);
    if (!token) throw unauthorized('Попроси родителей включить детский режим');
    const claims = await verifyToken(config.AUTH_SECRET, token);
    if (!claims || claims.typ !== 'kid') throw unauthorized('Попроси родителей включить детский режим');
    const child = await Child.findById(claims.sub);
    if (!child || String(child.parentId) !== claims.pid || child.sessionVersion !== claims.ver) {
      throw unauthorized('Попроси родителей включить детский режим');
    }
    req.child = child;
    next();
  };
}
