# TaskDrop

MVP сервиса платных заданий для Twitch-стримеров с виртуальным балансом и OBS-оверлеем.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

В Twitch Developer Console добавьте точный OAuth Redirect URL:

```text
http://localhost:3000/api/auth/twitch/callback
```

Для Render добавьте в Environment Variables:

```text
NEXT_PUBLIC_APP_URL=https://ваш-сервис.onrender.com
TWITCH_CLIENT_ID=ваш_client_id
TWITCH_CLIENT_SECRET=ваш_client_secret
SESSION_SECRET=длинная_случайная_строка
```

После этого Redirect URL в Twitch будет:

```text
https://ваш-сервис.onrender.com/api/auth/twitch/callback
```

## Что работает

- вход через Twitch и два демо-входа;
- виртуальное пополнение баланса зрителя;
- резервирование награды при отправке задания;
- полный возврат при отказе стримера;
- начисление стримеру после выполнения;
- демонстрационная заявка на вывод;
- защищённая уникальным ключом ссылка OBS Browser Source;
- локальное JSON-хранилище для MVP.

## Перед продакшеном

Замените JSON-хранилище на PostgreSQL, добавьте реальный платёжный провайдер,
идемпотентные вебхуки, модерацию заданий и полноценную систему выплат.
