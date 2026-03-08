#!/bin/bash
# Script de deploy para Google Cloud
# Uso: ./scripts/deploy.sh

set -e

echo "=== Deploy Pecuária Web ==="

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "ERRO: Arquivo .env não encontrado!"
  echo "Copie .env.production.example para .env e configure as variáveis."
  exit 1
fi

# Parar containers antigos
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# Build e subir
docker compose build --no-cache
docker compose up -d

# Aguardar app iniciar
echo "Aguardando aplicação iniciar..."
sleep 10

# Rodar migrações e seed
echo "Aplicando schema do banco..."
docker compose exec -T app sh -c "cd /app/backend && npx prisma db push" 2>/dev/null || true

echo ""
echo "=== Deploy concluído ==="
echo "Aplicação disponível em: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):3001"
echo ""
echo "Para ver logs: docker compose logs -f app"
