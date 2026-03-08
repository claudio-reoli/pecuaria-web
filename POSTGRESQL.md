# Configuração PostgreSQL

## Instalação em andamento

O PostgreSQL 16 está sendo instalado via winget. Após concluir:

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

## Alternativa: Docker

Se tiver Docker instalado:

```bash
docker compose up -d db
```

O `INICIAR.bat` tenta subir o PostgreSQL via Docker automaticamente.
