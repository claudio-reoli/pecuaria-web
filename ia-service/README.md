# Módulo de IA (Python) — RIA-01 a RIA-35

Serviço de Inteligência Artificial do sistema de gestão pecuária. **Todos os 35 requisitos RIA rodam em Python**, integrados aos módulos transacionais em Node.js.

## Arquitetura

- **Node.js** — Transacional: animais, lotes, pesagem, sanidade, reprodução, financeiro, etc.
- **Python (ia-service)** — IA: RIA-01 a RIA-35 (visão, ML, NLP, predições)

O Node faz proxy de `/api/ia/*` para este serviço.

## Funcionalidades (RIA)

- RIA-01 a RIA-35 — visão computacional, ML, NLP, predições, copiloto
- Ver `ARQUITETURA_RIA.md` na raiz do projeto para mapeamento completo

## Instalação

```bash
cd ia-service
pip install -r requirements.txt
```

## Execução

```bash
python run.py
# ou: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Serviço disponível em: http://localhost:8000  
Documentação Swagger: http://localhost:8000/docs

## Integração

O backend Node.js chama este serviço via HTTP. Configure `IA_SERVICE_URL` no `backend/.env` (padrão: `http://localhost:8000`).

Endpoints expostos pelo Node em `/api/ia/`:

- `POST /api/ia/estimativa-peso`
- `POST /api/ia/diagnostico-sugestao`
- `POST /api/ia/predicao-abate`
- `POST /api/ia/copiloto`

## Próximos passos (modelos reais)

- Integrar TensorFlow/PyTorch para visão computacional
- Integrar scikit-learn/XGBoost para predições
- Integrar LLM (RAG) para o copiloto
