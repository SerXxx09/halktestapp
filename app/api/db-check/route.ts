import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

function normalizeDatabaseUrl(value: string) {
  return value
    .trim()
    .replace(/^DATABASE_URL\s*=\s*/i, '')
    .replace(/^['\"]|['\"]$/g, '')
    .trim();
}

function getSafeUrlDiagnostics(value: string) {
  const normalized = normalizeDatabaseUrl(value);
  const hasValidProtocol = normalized.startsWith('postgresql://') || normalized.startsWith('postgres://');

  let host: string | null = null;
  let database: string | null = null;

  try {
    const parsed = new URL(normalized);
    host = parsed.hostname || null;
    database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : null;
  } catch {
    // Do not expose the raw secret value in API output.
  }

  return {
    hasValue: value.length > 0,
    length: value.length,
    normalizedLength: normalized.length,
    hasValidProtocol,
    host,
    database
  };
}

export async function GET() {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    return NextResponse.json({
      ok: false,
      message: 'DATABASE_URL не задан. Для первичного тестового деплоя это нормально.',
      hasDatabaseUrl: false
    });
  }

  const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);
  const diagnostics = getSafeUrlDiagnostics(rawDatabaseUrl);

  if (!diagnostics.hasValidProtocol) {
    return NextResponse.json(
      {
        ok: false,
        message: 'DATABASE_URL задан, но не похож на PostgreSQL connection string. Значение должно начинаться с postgresql:// или postgres://.',
        hasDatabaseUrl: true,
        diagnostics
      },
      { status: 400 }
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await pool.query('select now() as current_time');

    return NextResponse.json({
      ok: true,
      message: 'Подключение к PostgreSQL работает.',
      currentTime: result.rows[0]?.current_time ?? null,
      hasDatabaseUrl: true,
      diagnostics
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Не удалось подключиться к PostgreSQL.',
        error: error instanceof Error ? error.message : 'Unknown error',
        hasDatabaseUrl: true,
        diagnostics
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
