#!/bin/bash
# Script único de deploy - execute no servidor
# Uso: bash deploy-server.sh
# Pré-requisito: Projeto na pasta atual (copie os arquivos ou clone o repositório)

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "=========================================="
echo "  Deploy Pecuária Web - Google Cloud"
echo "=========================================="
echo ""

# --- 1. Instalar Docker (se não existir) ---
if ! command -v docker &>/dev/null; then
  echo "[1/6] Instalando Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y docker.io
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  echo "      Docker instalado. Se for solicitado, faça logout e login para usar docker sem sudo."
else
  echo "[1/6] Docker já instalado."
fi

# --- 2. Instalar Docker Compose (se não existir) ---
if ! docker compose version &>/dev/null; then
  echo "[2/6] Instalando Docker Compose..."
  sudo apt-get install -y docker-compose-v2 2>/dev/null || sudo apt-get install -y docker-compose
else
  echo "[2/6] Docker Compose já instalado."
fi

# --- 3. Criar .env ---
echo ""
echo "[3/6] Configuração do .env"
if [ -f .env ]; then
  echo "      .env já existe. Usar existente? (s/n)"
  read -r resp
  if [ "$resp" != "s" ] && [ "$resp" != "S" ]; then
    rm -f .env
  fi
fi

if [ ! -f .env ]; then
  if [ -n "$POSTGRES_PASSWORD" ] && [ -n "$JWT_SECRET" ]; then
    POSTGRES_PW="$POSTGRES_PASSWORD"
    JWT_SEC="$JWT_SECRET"
    echo "      Usando variáveis de ambiente."
  else
    echo "      Digite a senha do PostgreSQL (será usada pelo banco):"
    read -rs POSTGRES_PW
    echo ""
    echo "      Digite o JWT_SECRET (mín. 32 caracteres, ou Enter para gerar):"
    read -r JWT_SEC
  fi
  if [ -z "$JWT_SEC" ]; then
    JWT_SEC=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 40 | head -1)
    echo "      Gerado automaticamente."
  fi
  cat > .env << EOF
POSTGRES_USER=pecuaria
POSTGRES_PASSWORD=$POSTGRES_PW
POSTGRES_DB=pecuaria
JWT_SECRET=$JWT_SEC
IA_SERVICE_URL=http://localhost:8000
EOF
  echo "      .env criado."
else
  echo "      Mantendo .env existente."
fi

# --- 4. Build e subir containers ---
echo ""
echo "[4/6] Build e iniciando containers..."
docker compose build --no-cache 2>/dev/null || docker-compose build --no-cache
docker compose up -d 2>/dev/null || docker-compose up -d

# --- 5. Aguardar PostgreSQL ---
echo ""
echo "[5/6] Aguardando PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U pecuaria 2>/dev/null || docker-compose exec -T postgres pg_isready -U pecuaria 2>/dev/null; then
    echo "      PostgreSQL pronto."
    break
  fi
  sleep 1
  [ $i -eq 30 ] && echo "      Timeout aguardando PostgreSQL."
done

# --- 6. Schema e seed ---
echo ""
echo "[6/6] Aplicando schema do banco..."
docker compose exec -T app sh -c "cd /app/backend && npx prisma db push --skip-generate" 2>/dev/null || docker-compose exec -T app sh -c "cd /app/backend && npx prisma db push --skip-generate" 2>/dev/null || true

echo ""
echo "      Rodando seed inicial (admin@pecuaria.com / admin123)..."
docker compose exec -T app sh -c "cd /app/backend && npx prisma db seed" 2>/dev/null || docker-compose exec -T app sh -c "cd /app/backend && npx prisma db seed" 2>/dev/null || true

# --- Conclusão ---
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me 2>/dev/null || echo "SEU_IP")
echo ""
echo "=========================================="
echo "  Deploy concluído!"
echo "=========================================="
echo ""
echo "  Aplicação: http://${IP}:3001"
echo "  Health:    http://${IP}:3001/api/health"
echo ""
echo "  Login: admin@pecuaria.com"
echo "  Senha: admin123"
echo ""
echo "  Lembre-se de liberar a porta 3001 no firewall do Google Cloud."
echo "  Logs: docker compose logs -f app"
echo ""
