#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?Defina SUPABASE_DB_URL com a connection string do PostgreSQL.}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/biotrop-v2-$STAMP.dump"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo 'pg_dump não encontrado. Instale o cliente PostgreSQL na VM Azure.' >&2
  exit 1
fi

pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --file "$OUT"
find "$BACKUP_DIR" -type f -name 'biotrop-v2-*.dump' -mtime "+$RETENTION_DAYS" -delete
printf 'Backup criado: %s\n' "$OUT"
