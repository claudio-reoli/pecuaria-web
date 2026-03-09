#!/bin/bash
# Transfere dados do banco de desenvolvimento para o banco de producao.
# Uso: ./transferir-dev-para-prod.sh [--truncate-prod] [--backup-prod]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
DUMP_FILE="$SCRIPT_DIR/transferencia-pecuaria-$(date +%Y%m%d-%H%M%S).sql"

TRUNCATE_PROD=false
BACKUP_PROD=false

for arg in "$@"; do
  case $arg in
    --truncate-prod) TRUNCATE_PROD=true ;;
    --backup-prod)   BACKUP_PROD=true ;;
  esac
done

load_env() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
  fi
}

load_env "$BACKEND_DIR/.env"
DEV_URL="$DATABASE_URL"
load_env "$BACKEND_DIR/.env.production"
[ -z "$DATABASE_URL" ] && load_env "$PROJECT_ROOT/.env.production"
PROD_URL="$DATABASE_URL"

if [ -z "$DEV_URL" ]; then
  echo "ERRO: DATABASE_URL nao encontrado em backend/.env"
  exit 1
fi
if [ -z "$PROD_URL" ]; then
  echo "ERRO: Crie backend/.env.production com DATABASE_URL do ambiente de producao"
  exit 1
fi

echo ""
echo "=== Transferencia DEV -> PROD ==="
echo "Origem (dev):  ${DEV_URL/:[^:@]*@/:****@}"
echo "Destino (prod): ${PROD_URL/:[^:@]*@/:****@}"
echo "Arquivo dump:  $DUMP_FILE"
echo ""

# 1. Backup do prod (opcional)
if [ "$BACKUP_PROD" = true ]; then
  BACKUP_FILE="$SCRIPT_DIR/backup-prod-$(date +%Y%m%d-%H%M%S).sql"
  echo "[1/4] Backup do ambiente de producao..."
  pg_dump "$PROD_URL" --data-only --no-owner --no-privileges -f "$BACKUP_FILE"
  echo "       Salvo em: $BACKUP_FILE"
  echo ""
else
  echo "[1/4] Pulando backup prod (use --backup-prod para fazer backup)"
  echo ""
fi

# 2. Exportar dados do dev
echo "[2/4] Exportando dados do desenvolvimento..."
pg_dump "$DEV_URL" --data-only --no-owner --no-privileges -f "$DUMP_FILE"
echo "       Exportado: $(wc -c < "$DUMP_FILE") bytes"
echo ""

# 3. Truncar prod (opcional)
if [ "$TRUNCATE_PROD" = true ]; then
  echo "[3/4] Limpando tabelas do ambiente de producao..."
  psql "$PROD_URL" -c "
    DO \$\$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END \$\$;
  "
  echo "       Tabelas limpas."
  echo ""
else
  echo "[3/4] IMPORTANTE: Se prod ja tem dados, use --truncate-prod para evitar conflitos."
  echo ""
fi

# 4. Importar para prod
echo "[4/4] Importando dados para producao..."
psql "$PROD_URL" -f "$DUMP_FILE"

echo ""
echo "=== Transferencia concluida com sucesso ==="
echo "Arquivo dump mantido: $DUMP_FILE"
echo ""
