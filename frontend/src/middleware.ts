import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.SECRET_KEY || 'fundo-foundation-ultra-secure-key-2026-production-ready-jwt-secret-998877';

function base64urlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;

    // Cryptographic signature verification using native Web Crypto HMAC-SHA256
    const sigBytes = base64urlToBytes(signatureB64);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataBytes = enc.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );
    if (!valid) return false;

    // Decode and verify payload claims & expiration
    let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const payload = JSON.parse(atob(base64));

    if (payload.exp && typeof payload.exp === 'number') {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowInSeconds) {
        return false; // Token expired
      }
    }

    if (!payload.sub) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('fundo_access_token')?.value;
  const isAuth = token ? await verifyToken(token) : false;

  // 1. Handling /login and /admin/login
  if (pathname === '/login' || pathname === '/admin/login') {
    if (isAuth) {
      // If already authenticated, redirect to /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // If not authenticated and hitting /admin/login, redirect to canonical /login
    if (pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect all admin routes (/admin, /admin/*)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!isAuth) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete('fundo_access_token');
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/login',
  ],
};
