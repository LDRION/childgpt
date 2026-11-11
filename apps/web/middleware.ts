import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

// Edge-проверка подписи cookie: быстро отсекаем чужих. Версию токена и права
// окончательно проверяет API при каждом запросе.

const PARENT_COOKIE = 'cg_parent';
const KID_COOKIE = 'cg_kid';

async function tokenType(token: string | undefined): Promise<'parent' | 'kid' | null> {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    return payload.typ === 'parent' || payload.typ === 'kid' ? payload.typ : null;
  } catch {
    return null;
  }
}

function redirect(req: NextRequest, pathname: string, next?: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = next ? `?next=${encodeURIComponent(next)}` : '';
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isParent = (await tokenType(req.cookies.get(PARENT_COOKIE)?.value)) === 'parent';
  const isKid = (await tokenType(req.cookies.get(KID_COOKIE)?.value)) === 'kid';

  if (pathname.startsWith('/parent')) {
    if (isParent) return NextResponse.next();
    // Ребёнок в детском режиме не попадает в кабинет, даже набрав адрес вручную.
    return isKid ? redirect(req, '/kid') : redirect(req, '/login', pathname);
  }

  if (pathname.startsWith('/kid')) {
    return isKid ? NextResponse.next() : redirect(req, isParent ? '/parent' : '/login');
  }

  if (pathname === '/login' || pathname === '/register') {
    if (isKid) return redirect(req, '/kid');
    if (isParent) return redirect(req, '/parent');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/parent/:path*', '/kid/:path*', '/kid', '/parent', '/login', '/register'],
};
