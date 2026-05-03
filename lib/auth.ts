import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';
import { redirect } from 'next/navigation';
import { query } from './db';

export type UserRole = 'athlete' | 'admin';

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

const SESSION_COOKIE = 'halk_session';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  return createHash('sha256').update(process.env.DATABASE_URL || 'local-dev-secret').digest('hex');
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(':');

  if (!salt || !key) {
    return false;
  }

  const hashedBuffer = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');
  const keyBuffer = Buffer.from(key, 'hex');

  if (hashedBuffer.length !== keyBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashedBuffer, keyBuffer);
}

export function createSessionToken(user: CurrentUser) {
  const payload = base64Url(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 14
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id: number;
      exp: number;
    };

    if (!parsed.id || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);

  if (!session) {
    return null;
  }

  const result = await query<CurrentUser>(
    `select id, email, name, role from users where id = $1 limit 1`,
    [session.id]
  );

  return result.rows[0] ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return user;
}

export function setSessionCookie(user: CurrentUser) {
  cookies().set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function roleForEmail(email: string): UserRole {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'athlete';
}
