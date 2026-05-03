import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var halkPgPool: Pool | undefined;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error('DATABASE_URL is not configured');
  }

  return value
    .trim()
    .replace(/^DATABASE_URL\s*=\s*/i, '')
    .replace(/^['\"]|['\"]$/g, '')
    .trim();
}

export function getPool() {
  if (!globalThis.halkPgPool) {
    globalThis.halkPgPool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  return globalThis.halkPgPool;
}

export async function query<T = any>(text: string, params: unknown[] = []) {
  return getPool().query(text, params) as Promise<{ rows: T[]; rowCount: number | null }>;
}
