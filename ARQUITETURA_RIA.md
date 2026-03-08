# Arquitetura — Requisitos de IA (RIA-01 a RIA-35)

## Princípio

**Os 35 requisitos de IA (RIA-01 a RIA-35) rodam em Python.**  
**Os módulos transacionais (animais, lotes, pesagem, sanidade, reprodução, financeiro, etc.) rodam em Node.js.**

O Node.js **não implementa lógica de ML/IA**. Ele apenas:
- gerencia transações, CRUD e regras de negócio
- recebe requisições do frontend
- encaminha chamadas de IA para o **ia-service** (Python)
- persiste e expõe os dados

O Python (ia-service):
- implementa visão computacional, ML, NLP, predições
- recebe dados do Node (ou do frontend via proxy)
- devolve resultados que o Node usa para atualizar o sistema

---

## Fluxo de integração

```
Frontend (React)
       │
       ▼
Backend Node.js (transacional)
       │  /api/animais, /api/lotes, /api/pesagens, etc.
       │  /api/ia/*  →  proxy para Python
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
PostgreSQL                              ia-service (Python)
(dados)                                 RIA-01 a RIA-35
```

---

## Mapeamento RIA → ia-service (Python)

| ID    | Requisito                                      | Módulo Python        | Status |
|-------|------------------------------------------------|----------------------|--------|
| RIA-01 | Identificação animal por imagem (pelagem)      | `identificacao`      | stub   |
| RIA-02 | Estimativa de peso por foto                    | `peso_visual`        | stub   |
| RIA-03 | Detecção de comportamento de monta (câmera)   | `reproducao`         | stub   |
| RIA-04 | Sinais visuais de enfermidade em foto          | `saude_visual`       | stub   |
| RIA-05 | Estimativa de ECC por imagem                   | `ecc_imagem`         | stub   |
| RIA-06 | Alertas de sensores (atividade, ruminação)     | `sensores_saude`     | stub   |
| RIA-07 | Predição risco parto distócico                 | `reproducao`         | stub   |
| RIA-08 | Sugestão diagnósticos diferenciais             | `diagnostico`        | stub   |
| RIA-09 | Análise mucosa ocular (FAMACHA)                | `saude_visual`       | stub   |
| RIA-10 | Detecção surto sanitário (anomalias)           | `alertas_sanidade`   | stub   |
| RIA-11 | Probabilidade de prenhez antes do DG           | `reproducao`         | stub   |
| RIA-12 | Recomendação acasalamento touro × lote         | `reproducao`         | stub   |
| RIA-13 | Predição intervalo entre partos                | `reproducao`         | stub   |
| RIA-14 | Candidatas ao descarte reprodutivo             | `reproducao`         | stub   |
| RIA-15 | NDVI / biomassa por satélite                   | `pastagens`          | stub   |
| RIA-16 | Capacidade de suporte dinâmica                 | `pastagens`          | stub   |
| RIA-17 | Suplementação adaptativa por lote              | `nutricao`           | stub   |
| RIA-18 | Detecção degradação pastagem (NDVI)            | `pastagens`          | stub   |
| RIA-19 | Projeção data abate e peso carcaça             | `comercial`          | implementado |
| RIA-20 | Tipificação de carcaça esperada                | `comercial`          | stub   |
| RIA-21 | Alerta janela ótima de abate                   | `comercial`          | stub   |
| RIA-22 | Classificação potencial de desempenho          | `selecao`            | stub   |
| RIA-23 | Manutenção preditiva de máquinas               | `patrimonio`         | stub   |
| RIA-24 | Ponto ótimo de substituição de equipamento     | `patrimonio`         | stub   |
| RIA-25 | Inspeção de benfeitorias por foto              | `patrimonio`         | stub   |
| RIA-26 | Agenda semanal automática de tarefas           | `tarefas`            | stub   |
| RIA-27 | Registro por voz (ASR)                         | `voz`                | stub   |
| RIA-28 | OCR de NF, GTA, receituário                    | `ocr`                | stub   |
| RIA-29 | Geração automática de tarefas urgentes         | `tarefas`            | stub   |
| RIA-30 | Redistribuição de tarefas em tempo real        | `tarefas`            | stub   |
| RIA-31 | Copiloto da fazenda (LLM)                      | `copiloto`           | stub   |
| RIA-32 | Benchmarking com médias regionais              | `benchmark`          | stub   |
| RIA-33 | Projeção fluxo de caixa com IA                 | `financeiro`         | stub   |
| RIA-34 | Sugestão próximos passos operacionais          | `copiloto`           | stub   |
| RIA-35 | Resumo executivo automático                    | `copiloto`           | stub   |

---

## Estrutura do ia-service (Python)

```
ia-service/
├── main.py              # FastAPI app, routers
├── routers/
│   ├── identificacao.py   # RIA-01
│   ├── peso_visual.py     # RIA-02
│   ├── reproducao.py      # RIA-03, 07, 11, 12, 13, 14
│   ├── saude.py           # RIA-04, 06, 08, 09, 10
│   ├── ecc.py             # RIA-05
│   ├── pastagens.py       # RIA-15, 16, 18
│   ├── nutricao.py        # RIA-17
│   ├── comercial.py       # RIA-19, 20, 21
│   ├── selecao.py         # RIA-22
│   ├── patrimonio.py      # RIA-23, 24, 25
│   ├── tarefas.py         # RIA-26, 29, 30
│   ├── voz.py             # RIA-27
│   ├── ocr.py             # RIA-28
│   ├── copiloto.py        # RIA-31, 34, 35
│   ├── benchmark.py       # RIA-32
│   └── financeiro.py      # RIA-33
├── requirements.txt
└── README.md
```

---

## Resumo

| Camada            | Tecnologia | Responsabilidade                          |
|-------------------|------------|-------------------------------------------|
| Frontend          | React/TS   | UI, UX, chamadas à API                    |
| Backend Node.js   | TypeScript | Transações, CRUD, regras, proxy para IA   |
| ia-service        | Python     | **Todos os 35 requisitos RIA** (ML, visão, NLP) |
| Banco             | PostgreSQL | Dados transacionais                       |
