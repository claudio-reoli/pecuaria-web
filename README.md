# Sistema de Gestão de Pecuária Bovina de Corte

Plataforma web para gestão de fazenda de pecuária bovina — cadastro de animais, lotes, pesagens, reprodução e sanidade.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Fastify, Prisma
- **Banco:** PostgreSQL
- **IA (Python):** FastAPI — estimativa de peso, sugestão de diagnóstico, predição de abate, copiloto

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Docker)

## Como rodar

### 1. Subir o PostgreSQL

**Com Docker:**
```bash
docker compose up -d db
# Aguarde ~10 segundos para o banco iniciar
```

**Sem Docker:** Instale o [PostgreSQL](https://www.postgresql.org/download/windows/) e crie o banco `pecuaria`. Ajuste `backend/.env` se usar outro usuário/senha.

### 2. Instalar e iniciar

```bash
npm install
npm run setup
npm run dev
```

### 3. (Opcional) Serviço de IA em Python

```bash
cd ia-service
pip install -r requirements.txt
python run.py
```

Ou rode tudo junto: `npm run dev:all` (requer Python 3.10+)

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

**Ou separadamente:**

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Login de demonstração

- **Email:** admin@pecuaria.com  
- **Senha:** admin123

## Estrutura do projeto

```
pecuaria-web/
├── frontend/        # React + Vite (TypeScript)
│   └── src/
│       ├── pages/   # Dashboard, Animais, Lotes, Pesagens, Reprodução, Sanidade
│       ├── components/
│       ├── services/
│       └── contexts/
├── backend/         # Fastify + Prisma (Node.js/TypeScript)
│   └── src/
│       └── modules/ # auth, animais, lotes, pesagem, reproducao, sanidade, dashboard, ia
├── ia-service/      # Serviço de IA (Python/FastAPI)
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## Módulos implementados

- ✅ Autenticação (JWT, RBAC)
- ✅ Cadastro de animais
- ✅ Cadastro de lotes e piquetes
- ✅ Pesagens
- ✅ Movimentações entre lotes
- ✅ Reprodução (estações de monta, diagnósticos, partos)
- ✅ Sanidade (medicamentos, vacinações)
- ✅ Financeiro (receitas, despesas, DRE)
- ✅ Patrimônio (bens)
- ✅ Funcionários
- ✅ Tarefas
- ✅ Dashboard com indicadores
- ✅ IA (Python) — RIA-01 a RIA-35 (stubs)

## Próximos passos

Conforme `PLANEJAMENTO_SISTEMA_WEB.md`:

- Gestão financeira
- Pastagens e piquetes
- Relatórios avançados
- Integração RFID e balanças
