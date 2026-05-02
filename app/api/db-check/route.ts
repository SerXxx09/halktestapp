import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({
      ok: false,
      message: 'DATABASE_URL не задан. Для первичного тестового деплоя это нормально.',
      hasDatabaseUrl: false
    });
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await pool.query('select now() as current_time');

    return NextResponse.json({
      ok: true,
      message: 'Подключение к PostgreSQL работает.',
      currentTime: result.rows[0]?.current_time ?? null,
      hasDatabaseUrl: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Не удалось подключиться к PostgreSQL.',
        error: error instanceof Error ? error.message : 'Unknown error',
        hasDatabaseUrl: true
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
