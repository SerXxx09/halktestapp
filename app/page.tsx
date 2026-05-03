import Link from 'next/link';

async function getHealth() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const response = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return { ok: false, message: 'Health endpoint вернул ошибку' };
    }

    return response.json();
  } catch {
    return { ok: false, message: 'Health endpoint пока недоступен на этапе сборки' };
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">HALK MVP</p>
        <h1>Личный кабинет спортсменов</h1>
        <p className="lead">
          Тестовая версия системы для регистрации спортсменов, внесения результатов, ссылок на видео и админской проверки.
        </p>

        <div className="statusBox">
          <span className={health.ok ? 'dot ok' : 'dot warn'} />
          <div>
            <strong>{health.ok ? 'Приложение работает' : 'Приложение собрано'}</strong>
            <p>{health.message || 'API endpoint /api/health доступен.'}</p>
          </div>
        </div>

        <div className="grid">
          <Link href="/register">Регистрация</Link>
          <Link href="/login">Вход</Link>
          <Link href="/dashboard">Кабинет</Link>
          <Link href="/admin">Админка</Link>
          <a href="/api/setup-db">/api/setup-db</a>
          <a href="/api/db-check">/api/db-check</a>
        </div>
      </section>
    </main>
  );
}
