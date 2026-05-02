# halktestapp

Тестовое Next.js-приложение для проверки деплоя на ONREZA.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Деплой на ONREZA

Проект использует стандартные команды Next.js:

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`

Для теста база данных не обязательна. Если позже подключим PostgreSQL, нужно будет добавить переменную окружения:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```
