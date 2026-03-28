#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker bulunamadi. Docker Desktop'i acip tekrar deneyin."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm bulunamadi. Node 20+ ve corepack etkinlestirildikten sonra tekrar deneyin."
  echo "Ornek: corepack enable && corepack prepare pnpm@9.15.4 --activate"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env dosyasi .env.example uzerinden olusturuldu."
fi

echo "Docker servisleri baslatiliyor..."
docker compose up -d

echo "Bagimliliklar kuruluyor..."
pnpm install

echo "Prisma client uretiliyor..."
pnpm db:generate

echo "@gase/database build aliniyor..."
pnpm --filter @gase/database build

echo "Veritabani senkronize ediliyor ve seed yukleniyor..."
pnpm db:push
pnpm db:seed

echo "Kurulum tamamlandi. Uygulamayi baslatmak icin: pnpm dev"
