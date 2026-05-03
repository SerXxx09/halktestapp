import { NextResponse } from 'next/server';
import { setupSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await setupSchema();

    return NextResponse.json({
      ok: true,
      message: 'Таблицы users, results и audit_log созданы или уже существовали.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Не удалось подготовить базу данных.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
