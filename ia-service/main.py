"""
Módulo de Inteligência Artificial - Sistema Pecuária Bovina
RIA-01 a RIA-35 — todos os requisitos de IA rodam neste serviço (Python).
Integrado aos módulos transacionais em Node.js via proxy /api/ia/*
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

app = FastAPI(
    title="IA - Pecuária Bovina (RIA-01 a RIA-35)",
    description="Serviço de IA integrado aos módulos transacionais em Node.js",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class EstimativaPesoRequest(BaseModel):
    animal_id: Optional[str] = None
    imagem_base64: Optional[str] = None


class DiagnosticoSugestaoRequest(BaseModel):
    sinais_clinicos: list[str]
    historico_animal: Optional[dict] = None


class PredicaoAbateRequest(BaseModel):
    animal_id: str
    peso_atual: float
    gmd_medio: float
    peso_alvo: float


class CopilotoRequest(BaseModel):
    pergunta: str
    contexto: Optional[dict] = None


# --- Endpoints RIA (stubs — modelos reais integrados posteriormente) ---

@app.get("/health")
def health():
    return {"status": "ok", "servico": "ia-pecuaria", "ria_count": 35}


@app.get("/ria")
def listar_ria():
    """Lista todos os 35 requisitos RIA disponíveis."""
    from routers.ria_map import RIA_ENDPOINTS
    return {"requisitos": list(RIA_ENDPOINTS.keys()), "total": 35}


# RIA-02
@app.post("/ia/estimativa-peso")
async def estimar_peso(req: EstimativaPesoRequest):
    if not req.imagem_base64:
        raise HTTPException(400, "Envie imagem_base64 no body")
    return {"peso_estimado_kg": 420.0, "margem_erro_kg": 15.0, "confianca": 0.85}


# RIA-08
@app.post("/ia/diagnostico-sugestao")
async def sugerir_diagnostico(req: DiagnosticoSugestaoRequest):
    return {
        "diagnosticos_sugeridos": [
            {"doenca": "Tristeza parasitária", "probabilidade": 0.6},
            {"doenca": "Anaplasmose", "probabilidade": 0.3},
        ],
        "protocolo_recomendado": "Aguardar avaliação do médico-veterinário.",
    }


# RIA-19
@app.post("/ia/predicao-abate")
async def predizer_abate(req: PredicaoAbateRequest):
    if req.gmd_medio <= 0:
        raise HTTPException(400, "GMD deve ser positivo")
    dias = int((req.peso_alvo - req.peso_atual) / req.gmd_medio)
    data_estimada = (datetime.now() + timedelta(days=dias)).strftime("%Y-%m-%d")
    return {
        "data_estimada": data_estimada,
        "dias_restantes": max(0, dias),
        "confianca": 0.9,
    }


# RIA-31
@app.post("/ia/copiloto")
async def copiloto(req: CopilotoRequest):
    return {
        "resposta": "Copiloto em desenvolvimento. Integrar LLM (RAG) com dados da propriedade.",
        "fontes": [],
    }


# RIA-05
@app.post("/ia/estimar-ecc-imagem")
async def estimar_ecc(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "Imagem vazia")
    return {"ecc_estimado": 3.0, "confianca": 0.8}


# --- Stubs para os demais RIA (RIA-01, 03, 04, 06, 07, 09 a 18, 20 a 35) ---
# Endpoints retornam resposta placeholder; modelos reais são integrados conforme roadmap

_ria_stubs = [
    ("/ia/identificacao-pelagem", "RIA-01", "post"),
    ("/ia/deteccao-monta", "RIA-03", "post"),
    ("/ia/sinais-enfermidade", "RIA-04", "post"),
    ("/ia/alertas-sensores", "RIA-06", "post"),
    ("/ia/risco-parto-distocico", "RIA-07", "post"),
    ("/ia/famacha-ocular", "RIA-09", "post"),
    ("/ia/detectar-surto", "RIA-10", "post"),
    ("/ia/probabilidade-prenhez", "RIA-11", "post"),
    ("/ia/acasalamento-otimo", "RIA-12", "post"),
    ("/ia/predicao-iep", "RIA-13", "post"),
    ("/ia/candidatas-descarte", "RIA-14", "post"),
    ("/ia/ndvi-biomassa", "RIA-15", "post"),
    ("/ia/capacidade-suporte", "RIA-16", "post"),
    ("/ia/suplementacao-adaptativa", "RIA-17", "post"),
    ("/ia/degradacao-pastagem", "RIA-18", "post"),
    ("/ia/tipificacao-carcaca", "RIA-20", "post"),
    ("/ia/alerta-janela-abate", "RIA-21", "post"),
    ("/ia/potencial-desempenho", "RIA-22", "post"),
    ("/ia/manutencao-preditiva", "RIA-23", "post"),
    ("/ia/substituicao-equipamento", "RIA-24", "post"),
    ("/ia/inspecao-benfeitorias", "RIA-25", "post"),
    ("/ia/agenda-tarefas", "RIA-26", "post"),
    ("/ia/registro-voz", "RIA-27", "post"),
    ("/ia/ocr-documentos", "RIA-28", "post"),
    ("/ia/tarefa-urgente", "RIA-29", "post"),
    ("/ia/redistribuir-tarefas", "RIA-30", "post"),
    ("/ia/benchmark", "RIA-32", "post"),
    ("/ia/projecao-fluxo-caixa", "RIA-33", "post"),
    ("/ia/proximos-passos", "RIA-34", "post"),
    ("/ia/resumo-executivo", "RIA-35", "post"),
]


def _make_stub(ria_id: str):
    async def handler(body: Optional[dict] = None):
        return {"requisito": ria_id, "status": "stub", "mensagem": f"{ria_id} — modelo a integrar"}
    return handler


for path, ria_id, _ in _ria_stubs:
    app.add_api_route(path, _make_stub(ria_id), methods=["POST"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
