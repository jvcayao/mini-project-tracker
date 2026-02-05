# Mini Project Tracker

Project and task management app. Laravel API + React frontend.

## Requirements

- PHP 8.5+
- Node 22+
- MySQL
- Docker (optional, for Sail)

## Setup

### Backend

**With Docker (Sail):**
```bash
cd api
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
```

**Without Docker:**
```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env` with your local MySQL credentials:
```
DB_HOST=127.0.0.1
DB_DATABASE=mini_project_tracker
DB_USERNAME=root
DB_PASSWORD=
```

Then run:
```bash
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd web
npm install
```

## Running

**Backend with Sail:**
```bash
cd api && ./vendor/bin/sail up -d
```
Runs on http://localhost

**Backend without Sail:**
```bash
cd api && php artisan serve
```
Runs on http://localhost:8000

**Note:** Frontend is configured for Sail (port 80). If using `php artisan serve`, update proxy in `web/vite.config.ts`:
```js
target: 'http://localhost:8000'
```

**Frontend:**
```bash
cd web && npm run dev
```
Runs on http://localhost:5173

## Seed Data

```bash
cd api

# With Sail
./vendor/bin/sail artisan db:seed

# Without Sail
php artisan db:seed
```

Creates 3 projects and 15 tasks.

Reset everything: `php artisan migrate:fresh --seed`

## Limitations

- No authentication (not required for this project)
- Search only works on task titles
- Bulk actions only support marking as done
