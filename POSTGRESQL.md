# Configuração PostgreSQL

## Instalação

O PostgreSQL 16 pode ser instalado via winget:

```powershell
winget install PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
```

**Durante o assistente de instalação (se aparecer):**

1. **Defina a senha** do usuário `postgres` como `postgres` durante o assistente (ou ajuste `backend/.env` conforme sua senha).
2. **Crie o banco** (se não existir):
   - Abra pgAdmin ou use o `psql` no terminal
   - Execute: `CREATE DATABASE pecuaria;`
   - Ou use o SQL Shell (psql) que vem com o PostgreSQL

3. **Reinicie o serviço** se necessário:
   - Services → PostgreSQL 16 → Reiniciar

## Conexão (backend/.env)

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pecuaria"
```

Se você definiu outra senha na instalação, altere o valor acima.

## Setup automático

Após o PostgreSQL estar rodando, execute na pasta do projeto:

```
SETUP-BANCO.bat
```

Isso cria o banco `pecuaria`, as tabelas (Prisma) e os dados iniciais.  
**Login:** admin@pecuaria.com / admin123

## Alternativa: Docker

Se tiver Docker instalado:

```bash
docker compose up -d db
```

O `INICIAR.bat` tenta subir o PostgreSQL via Docker automaticamente.
