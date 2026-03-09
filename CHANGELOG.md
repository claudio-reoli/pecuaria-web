# Changelog

## [1.1.0] - 2026-03-09

### Corrigido
- Backend: conflito `@fastify/static` registrado duas vezes - uploads servidos via rota customizada
- Script de transferência: `Join-Path` e argumentos do `pg_dump`/`psql` para compatibilidade com PowerShell

### Adicionado
- Suporte a PostgreSQL via Docker: `docker-compose.dev.yml`, `DOCKER-INICIAR.bat`, `DOCKER-SETUP-COMPLETO.bat`
- Scripts de transferência dev→prod: `transferir-dev-para-prod.ps1`, `.sh`, `.bat`
- Script de export dump para importação manual: `transferir-dev-prod-via-dump.ps1`
- `backend/.env.production` e `.env.production.example` para configuração de produção
- `scripts/README-TRANSFERENCIA.md` com instruções de uso
- Scripts npm: `db:transfer-dev-prod`, `db:export-dump`

### Infraestrutura
- Configuração para servidor de produção em `34.26.233.153`
- Documentação `CONFIGURAR-POSTGRES.md` e atualização do `POSTGRESQL.md`

---

## [1.0.0] - Inicial

- Sistema de gestão de pecuária bovina de corte
- Módulos: Animais, Lotes, Piquetes, Pesagens, Reprodução, Sanidade, Financeiro, Movimentações, Patrimônio, Funcionários, Fornecedores, Tarefas
- Dashboard com KPIs e gráficos
- ia-service Python com 35 RIA mapeados
- Autenticação JWT
- PostgreSQL + Prisma
