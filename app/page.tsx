async function getHealth() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const response = await fetch(`${baseUrl}/api/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, message: "Health endpoint вернул ошибку" };
    }

    return response.json();
  } catch {
    return { ok: false, message: "Health endpoint пока недоступен на этапе сборки" };
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">ONREZA deployment test</p>
        <h1>Halk Test App</h1>
        <p className="lead">
          Минимальное Next.js-приложение для проверки деплоя, домена и будущего подключения PostgreSQL.
        </p>

        <div className="statusBox">
          <span className={health.ok ? "dot ok" : "dot warn"} />
          <div>
            <strong>{health.ok ? "Приложение работает" : "Приложение собрано"}</strong>
            <p>{health.message || "API endpoint /api/health доступен."}</p>
          </div>
        </div>

        <div className="grid">
          <a href="/api/health">/api/health</a>
          <a href="/api/db-check">/api/db-check</a>
        </div>
      </section>
    </main>
  );
}
