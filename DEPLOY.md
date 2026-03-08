# Deploy - Sistema Pecuária (Google Cloud)

Deploy no servidor **35.243.202.115** (Debian 12, Docker).

## Pré-requisitos no servidor

- Docker e Docker Compose instalados
- Acesso SSH ao servidor

---

## Passo 1: Conectar no servidor

```bash
ssh claudio.reoli.car2@gmail.com@35.243.202.115
```

Ou, se usar chave SSH com outro usuário (ex: usuário da VM):

```bash
ssh SEU_USUARIO@35.243.202.115
```

---

## Passo 2: Instalar Docker (se necessário)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
# Faça logout e login para aplicar o grupo docker
```

---

## Passo 3: Clonar o projeto

```bash
cd ~
git clone URL_DO_SEU_REPOSITORIO pecuaria-web
cd pecuaria-web
```

**Se não usar Git**, copie os arquivos do projeto para o servidor (scp, rsync, etc.):

```bash
# Na sua máquina local (ajuste 'usuario' para o usuário SSH da VM):
rsync -avz --exclude node_modules --exclude .git ./pecuaria-web/ usuario@35.243.202.115:~/pecuaria-web/
```

> **Nota:** No Google Cloud, o usuário SSH costuma ser o que você configurou (ex: seu e-mail ou nome). Verifique em "SSH" no console da VM.

---

## Passo 4: Configurar variáveis de ambiente

```bash
cd ~/pecuaria-web
cp .env.production.example .env
nano .env
```

Configure no `.env`:

```
POSTGRES_USER=pecuaria
POSTGRES_PASSWORD=SUA_SENHA_MUITO_SEGURA
POSTGRES_DB=pecuaria

JWT_SECRET=UMA_CHAVE_JWT_ALEA_DE_PELO_MENOS_32_CARACTERES
IA_SERVICE_URL=http://localhost:8000
```

Salve e feche o editor (Ctrl+X, Y, Enter no nano).

---

## Passo 5: Deploy

```bash
cd ~/pecuaria-web
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Ou manualmente:

```bash
docker compose build --no-cache
docker compose up -d

# Aplicar schema do banco
docker compose exec app sh -c "cd /app/backend && npx prisma db push"

# (Opcional) Rodar seed inicial
docker compose exec app sh -c "cd /app/backend && npx prisma db seed"
```

---

## Passo 6: Verificar

- **Aplicação:** http://35.243.202.115:3001
- **Health check:** http://35.243.202.115:3001/api/health

**Login padrão** (após seed):  
- E-mail: `admin@pecuaria.com`  
- Senha: `admin123`

Altere a senha no primeiro acesso.

---

## Firewall (Google Cloud)

Libere a porta 3001 no VPC do Google Cloud:

1. Console Google Cloud → VPC network → Firewall
2. Nova regra:
   - Nome: `allow-pecuaria`
   - Direção: Ingress
   - Destino: Todas as instâncias na rede
   - IP: 0.0.0.0/0
   - Protocolo/porta: tcp:3001

Ou via gcloud:

```bash
gcloud compute firewall-rules create allow-pecuaria --allow tcp:3001 --source-ranges 0.0.0.0/0
```

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `docker compose logs -f app` | Ver logs da aplicação |
| `docker compose logs -f postgres` | Ver logs do PostgreSQL |
| `docker compose restart app` | Reiniciar aplicação |
| `docker compose down` | Parar tudo |
| `docker compose up -d` | Subir novamente |

---

## Atualizar aplicação

```bash
cd ~/pecuaria-web
git pull   # ou copie os novos arquivos
./scripts/deploy.sh
```

---

## Backup do banco

```bash
docker compose exec postgres pg_dump -U pecuaria pecuaria > backup_$(date +%Y%m%d).sql
```
