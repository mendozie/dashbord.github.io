# Situational Center Dashboard

React + Vite дашборд. Готов для локальной разработки и деплоя на GitHub Pages.

## Локальный запуск
- `npm install`
- `npm run dev` (откроется http://localhost:5173)

## Продакшн‑сборка
- `npm run build`
- `npm run preview` — проверка сборки локально.

## Деплой на GitHub Pages
- В репозитории настроен workflow `.github/workflows/deploy.yml` (деплой по пушу в `main`).
- `vite.config.js` содержит `base: '/'`, `public/CNAME` — `www.mendozie.ru`.
- Для кастомного домена пропиши в DNS CNAME: `www` → `mendozie.github.io`.
