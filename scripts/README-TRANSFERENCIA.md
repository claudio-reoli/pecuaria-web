# Transferência de Dados DEV → PROD

Scripts para transferir dados do banco de desenvolvimento para o banco de produção.

## Pré-requisitos

- **PostgreSQL client** (pg_dump, psql) instalado e no PATH  
  - Ou PostgreSQL completo instalado (inclui os clientes)  
  - Em Windows: `C:\Program Files\PostgreSQL\16\bin\` no PATH  

## Configuração

1. **Crie `backend/.env.production`** com a URL do banco de produção:

```
DATABASE_URL="postgresql://usuario:senha@servidor-prod:5432/pecuaria"
```

2. **`backend/.env`** já deve ter a URL de desenvolvimento (local ou Docker).

## Uso

### Windows (PowerShell)

```powershell
cd pecuaria-web
.\scripts\transferir-dev-para-prod.ps1
```

**Opções:**

| Parâmetro      | Descrição                                   |
|----------------|---------------------------------------------|
| `-TruncateProd`| Limpa as tabelas de prod antes de importar  |
| `-BackupProd`  | Faz backup do prod antes de sobrescrever    |
| `-DryRun`      | Apenas exibe o que seria feito              |

**Exemplos:**

```powershell
# Transferência simples (prod vazio ou sem conflitos)
.\scripts\transferir-dev-para-prod.ps1

# Prod já tem dados → truncar primeiro
.\scripts\transferir-dev-para-prod.ps1 -TruncateProd

# Backup do prod antes de sobrescrever
.\scripts\transferir-dev-para-prod.ps1 -TruncateProd -BackupProd
```

### Windows (batch)

```cmd
scripts\transferir-dev-para-prod.bat --truncate-prod --backup-prod
```

### Linux / Mac

```bash
chmod +x scripts/transferir-dev-para-prod.sh
./scripts/transferir-dev-para-prod.sh
```

**Opções:**

- `--truncate-prod` – limpa tabelas de prod
- `--backup-prod`   – faz backup de prod antes

## Com Docker

Se `pg_dump`/`psql` não estiverem no sistema:

```bash
# Exportar dev
docker run --rm -e PGPASSWORD=postgres postgres:16-alpine pg_dump "postgresql://postgres:postgres@host.docker.internal:5432/pecuaria" --data-only --no-owner -f - > dump.sql

# Importar em prod (após truncar se necessário)
psql "postgresql://usuario:senha@prod-host:5432/pecuaria" -f dump.sql
```

Ou configure o banco de prod para acesso remoto e ajuste as URLs.
