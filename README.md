# GASE QR Menu

QR kod tabanli restoran menu, siparis, masa yonetimi ve odeme sistemi.

## Stack

- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 14 + Tailwind CSS
- Realtime: Socket.IO + Redis
- Storage: MinIO (S3-compatible)
- Monorepo: Turborepo + pnpm

## Gereksinimler

- Node.js `20.11.0`
- pnpm `9.15.4`
- Docker Desktop

Projede `npm` yerine `pnpm` kullanilir. `npm i` ile kurulum yapmayin.

## Hizli Baslangic

### 1. Node surumunu hazirla

Bu repo kokunde `.nvmrc` bulunur.

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

### 2. Ilk kurulum

Asagidaki komut:
- `.env` dosyasini olusturur
- Docker servislerini kaldirir
- bagimliliklari kurar
- Prisma client uretir
- `@gase/database` paketini build eder
- veritabanini `db push` ile senkronize eder
- seed verilerini yukler

```bash
pnpm run setup:dev
```

### 3. Uygulamayi baslat

```bash
pnpm dev
```

Beklenen adresler:

- Web: `http://127.0.0.1:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/api/docs`

## Manuel Kurulum

Kurulumu adim adim yapmak isterseniz:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.15.4 --activate

cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm --filter @gase/database build

cd packages/database
set -a
source ../../.env
set +a
pnpm exec prisma db push
pnpm exec tsx prisma/seed.ts
cd ../..

pnpm dev
```

## Faydali Komutlar

```bash
pnpm dev
pnpm build
pnpm test
pnpm db:generate
pnpm db:push
pnpm db:seed
docker compose up -d
docker compose down
```

## Notlar

- `pnpm dev` calismadan once kok script otomatik olarak `@gase/database` build alir.
- Docker servisleri:
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`
  - MinIO API: `localhost:9000`
  - MinIO Console: `localhost:9001`
- Varsayilan gelistirme ayarlari `.env.example` icindedir.

## Sorun Giderme

### `pnpm: command not found`

```bash
nvm use
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

### `Cannot find module '@gase/database/dist/index.js'`

```bash
pnpm --filter @gase/database build
```

### Prisma `DATABASE_URL` hatasi

`.env` dosyasinin repo kokunde oldugundan emin olun:

```bash
cp .env.example .env
```

### Docker servislerini kontrol et

```bash
docker compose ps
```
