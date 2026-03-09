# Como configurar o PostgreSQL para o Sistema Pecuária

## Situação atual

O PostgreSQL 16 foi instalado, mas o **cluster de dados** pode não ter sido inicializado (o assistente pode ter ficado aberto aguardando).

## Opção 1: Concluir a instalação do PostgreSQL

1. Abra **SQL Shell (psql)** ou **pgAdmin 4** no menu Iniciar (foram instalados com o PostgreSQL).

2. Se o assistente de configuração ainda estiver aberto:
   - Defina a **senha do usuário postgres** como: `postgres`
   - Use a porta padrão: **5432**
   - Conclua o assistente.

3. Se não houver assistente, execute o instalador novamente:
   ```
   C:\Program Files\PostgreSQL\16\installer\server\postgresql-16-x64.exe
   ```
   Ou reinstale: `winget install PostgreSQL.PostgreSQL.16`

4. **Reinicie o computador** após a instalação para o serviço iniciar.

5. Execute o setup do banco:
   ```
   SETUP-BANCO.bat
   ```

## Opção 2: Usar Docker (recomendado se já tiver Docker)

```bash
cd c:\Users\Claudio\OneDrive\Projetos\Cursor\.cursor\agents\pecuaria-web
```

Crie um arquivo `.env` na raiz do projeto (ou use o docker-compose) com:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pecuaria
```

Depois:
```bash
docker compose up -d postgres
```

Ajuste o `backend\.env` para usar o Docker:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pecuaria"
```

E rode: `SETUP-BANCO.bat` ou `npm run setup`

## Verificar se está funcionando

```powershell
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432 -c "SELECT version();"
```

Se conectar, o PostgreSQL está OK.
