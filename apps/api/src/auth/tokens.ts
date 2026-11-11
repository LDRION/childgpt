import { SignJWT, jwtVerify } from 'jose';

// Формат токенов общий с apps/web (middleware проверяет cookie тем же AUTH_SECRET).
export const PARENT_COOKIE = 'cg_parent';
export const KID_COOKIE = 'cg_kid';

const PARENT_TTL_SECONDS = 60 * 60 * 24 * 30;
const KID_TTL_SECONDS = 60 * 60 * 24 * 90;

export interface ParentClaims {
  typ: 'parent';
  sub: string;
  ver: number;
}

export interface KidClaims {
  typ: 'kid';
  sub: string;
  pid: string;
  ver: number;
}

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signParentToken(secret: string, parentId: string, ver: number): Promise<string> {
  return new SignJWT({ typ: 'parent', ver })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(parentId)
    .setIssuedAt()
    .setExpirationTime(`${PARENT_TTL_SECONDS}s`)
    .sign(key(secret));
}

export async function signKidToken(secret: string, childId: string, parentId: string, ver: number): Promise<string> {
  return new SignJWT({ typ: 'kid', pid: parentId, ver })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(childId)
    .setIssuedAt()
    .setExpirationTime(`${KID_TTL_SECONDS}s`)
    .sign(key(secret));
}

export async function verifyToken(secret: string, token: string): Promise<ParentClaims | KidClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null;
    if (payload.typ === 'parent') return { typ: 'parent', sub: payload.sub, ver: payload.ver };
    if (payload.typ === 'kid' && typeof payload.pid === 'string') return { typ: 'kid', sub: payload.sub, pid: payload.pid, ver: payload.ver };
    return null;
  } catch {
    return null;
  }
}

export function cookieOptions(isProd: boolean, kind: 'parent' | 'kid') {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: (kind === 'parent' ? PARENT_TTL_SECONDS : KID_TTL_SECONDS) * 1000,
  };
}
