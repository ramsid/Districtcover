"""
backend/main.py — FastAPI app for District One.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import RAG


app = FastAPI(title="District One API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_rag_instance: RAG | None = None


def get_rag() -> RAG:
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAG()
    return _rag_instance


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=10)


class SourceModel(BaseModel):
    source: str
    page: int
    preview: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceModel]
    chunks_retrieved: int


class CorpusItem(BaseModel):
    filename: str
    size_bytes: int
    chunks: int


@app.get("/health")
def health():
    return {"ok": True, "service": "district-one"}


@app.post("/api/rag/ask", response_model=AskResponse)
def rag_ask(payload: AskRequest):
    rag = get_rag()
    result = rag.ask(payload.question, top_k=payload.top_k)
    return AskResponse(**result.to_dict())


@app.get("/api/rag/corpus", response_model=list[CorpusItem])
def rag_corpus():
    return get_rag().list_corpus()


@app.post("/api/rag/reload")
def rag_reload():
    return {"total_chunks": get_rag().reload()}
