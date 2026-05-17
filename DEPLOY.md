# Tom Farm deploy на VPS через Git, Docker и Nginx

Инструкция сделана так, чтобы не сломать два уже работающих проекта на VPS. Новый проект будет жить в отдельной папке, отдельном Docker Compose project и на отдельном локальном порту `127.0.0.1:3017`. Снаружи порт не открывается.

## 1. Что понадобится

- Домен или поддомен, например `tomfarm.example.com`.
- VPS, где уже стоят Docker, Docker Compose и Nginx.
- Доступ к VPS по SSH.
- GitHub/GitLab/Bitbucket репозиторий для проекта.

В командах ниже замени:

- `tomfarm.example.com` на свой домен.
- `https://github.com/USER/tom-farm.git` на ссылку своего репозитория.
- `123456789` на свой Telegram ID администратора.

## 2. Подготовка Git на компьютере

Открой терминал в папке проекта:

```bash
cd "c:\Users\be4ho\Desktop\WORK\TOM FARM DEFINITIVE"
```

Если Git еще не включен:

```bash
git init
git branch -M main
```

Проверь файлы:

```bash
git status
```

Добавь проект в коммит:

```bash
git add .
git commit -m "Prepare Tom Farm for VPS deploy"
```

Создай пустой репозиторий на GitHub/GitLab, потом подключи его:

```bash
git remote add origin https://github.com/USER/tom-farm.git
git push -u origin main
```

Если `origin` уже существует:

```bash
git remote -v
git remote set-url origin https://github.com/USER/tom-farm.git
git push -u origin main
```

## 3. DNS домена

В панели домена создай `A` запись:

```text
tomfarm.example.com -> IP_ТВОЕГО_VPS
```

Подожди, пока DNS обновится. Иногда это занимает от пары минут до нескольких часов.

## 4. Загрузка проекта на VPS

Зайди на сервер:

```bash
ssh root@IP_ТВОЕГО_VPS
```

Создай отдельную папку для сайтов, если ее нет:

```bash
mkdir -p /opt/sites
cd /opt/sites
```

Склонируй проект:

```bash
git clone https://github.com/USER/tom-farm.git tom-farm
cd /opt/sites/tom-farm
```

## 5. Настройка `.env` на VPS

Создай `.env` из примера:

```bash
cp .env.example .env
nano .env
```

Пример:

```env
TELEGRAM_BOT_TOKEN=сюда_токен_бота
TELEGRAM_BOT_USERNAME=tomfarm_bot
ADMIN_TELEGRAM_IDS=123456789
PORT=3001
TOM_FARM_HOST_PORT=3017
```

Важно:

- `PORT=3001` это порт внутри контейнера, обычно не меняй.
- `TOM_FARM_HOST_PORT=3017` это локальный порт VPS. Если он занят другим проектом, поставь другой, например `3018`.
- `TELEGRAM_BOT_USERNAME` это username бота без `@`. Он нужен, чтобы сайт открывал бота с командой `/start`.

Авторизация работает просто: сайт покажет кнопку Telegram, человек откроет бота, нажмет Start, бот получит `/start login_...`, и сайт авторизует пользователя автоматически. `BotFather /setdomain` для этого способа не нужен.

Чтобы админы получали уведомления о заказах, каждый админ из `ADMIN_TELEGRAM_IDS` должен один раз открыть этого бота и нажать Start. Telegram не разрешает боту писать человеку первым, пока человек сам не открыл бота.

Проверить, занят ли порт:

```bash
ss -ltnp | grep ':3017'
```

Если команда ничего не показала, порт свободен.

## 6. Запуск Docker без конфликта с другими проектами

Находясь в `/opt/sites/tom-farm`, выполни:

```bash
docker compose up -d --build
```

Проверь контейнер:

```bash
docker compose ps
docker compose logs -f app
```

Проверь API локально на VPS:

```bash
curl http://127.0.0.1:3017/api/health
```

Должен быть ответ:

```json
{"ok":true}
```

## 7. Настройка Nginx

Создай отдельный конфиг. Не редактируй конфиги двух старых проектов.

```bash
nano /etc/nginx/sites-available/tom-farm
```

Вставь:

```nginx
server {
    listen 80;
    server_name tomfarm.example.com;

    client_max_body_size 120m;

    location / {
        proxy_pass http://127.0.0.1:3017;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включи сайт:

```bash
ln -s /etc/nginx/sites-available/tom-farm /etc/nginx/sites-enabled/tom-farm
```

Проверь, что Nginx-конфиг не сломан:

```bash
nginx -t
```

Если написано `syntax is ok` и `test is successful`, перезагрузи Nginx:

```bash
systemctl reload nginx
```

## 8. HTTPS через Certbot

Если Certbot уже стоит:

```bash
certbot --nginx -d tomfarm.example.com
```

Если Certbot не стоит на Ubuntu/Debian:

```bash
apt update
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tomfarm.example.com
```

Проверь автообновление сертификата:

```bash
certbot renew --dry-run
```

## 9. Как обновлять сайт после изменений

На компьютере:

```bash
git add .
git commit -m "Update Tom Farm"
git push
```

На VPS:

```bash
cd /opt/sites/tom-farm
git pull
docker compose up -d --build
docker compose ps
```

Nginx трогать не нужно, если порт и домен не менялись.

## 10. Как не поломать другие проекты

- Не используй `docker compose down` в папках других проектов.
- Не удаляй общие Docker networks и volumes вручную.
- Все команды `docker compose ...` выполняй только из `/opt/sites/tom-farm`.
- В Nginx создай отдельный файл `/etc/nginx/sites-available/tom-farm`.
- Перед reload всегда запускай `nginx -t`.
- Порт `3017` слушает только `127.0.0.1`, поэтому он не открывается наружу и не конфликтует с публичными портами `80/443`.

## 11. Бэкап данных

Важные данные лежат на VPS в:

```text
/opt/sites/tom-farm/data
/opt/sites/tom-farm/uploads
```

`data/db.json` не коммитится в Git специально: это живая база сайта. При первом запуске она создается из `data/initial-products.json` и `data/initial-contacts.json`.

Сделать архив:

```bash
cd /opt/sites/tom-farm
tar -czf tom-farm-backup-$(date +%F).tar.gz data uploads .env
```

## 12. Быстрая диагностика

Контейнеры:

```bash
cd /opt/sites/tom-farm
docker compose ps
```

Логи:

```bash
docker compose logs -f app
```

Проверка локального порта:

```bash
curl -I http://127.0.0.1:3017
curl http://127.0.0.1:3017/api/health
```

Проверка Nginx:

```bash
nginx -t
systemctl status nginx
```
