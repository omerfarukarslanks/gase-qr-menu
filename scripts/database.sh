#!/usr/bin/env sh
set -eu

if [ "$#" -eq 0 ]; then
  echo "Kullanim: sh ./scripts/database.sh <komut>"
  exit 1
fi

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ ! -f "$ROOT_DIR/.env" ]; then
  echo ".env bulunamadi. Once cp .env.example .env calistirin."
  exit 1
fi

cd "$ROOT_DIR/packages/database"

set -a
. ../../.env
set +a

pnpm exec "$@"
