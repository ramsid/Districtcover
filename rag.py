"""
backend/rag.py — Fake RAG for the demo video.

Drop-in replacement for the real RAG. Same class interface (RAG.ask),
so the FastAPI endpoint and frontend don't need to change.

Why fake: the demo video records a controlled, scripted Q&A flow.
A real LLM call adds latency, occasional weirdness, and zero benefit
when you control which questions get typed.

How matching works:
  - Lowercase the question
  - For each canned answer, check if all its required keywords appear
  - First match wins
  - No match → graceful "I can't find that" with a suggestion list
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Canned answers
# ---------------------------------------------------------------------------
# Each entry has:
#   keywords: ALL must appear (substring match) for this answer to fire
#   answer: the response text — written to sound grounded, not LLM-generic
#   sources: 1-2 citations that look like real RAG output
#
# Order matters: more specific answers first, fallbacks last.

CANNED_QA = [
    {
        "keywords": ["deductible"],
        "answer": (
            "Your Business Personal Property deductible is $1,000 per occurrence "
            "(ACORD 140 Property Section). Spoilage and equipment breakdown each "
            "carry a $500 deductible. Property damage liability under the GL "
            "policy has a $500 deductible (ACORD 126)."
        ),
        "sources": [
            {
                "source": "ACORD_140_filled.pdf",
                "page": 1,
                "preview": "Coverages — Business Personal Property: $95,000 limit, $1,000 deductible, Replacement Cost valuation, Special Causes of Loss...",
            },
            {
                "source": "ACORD_126_filled.pdf",
                "page": 1,
                "preview": "Property Damage Deductible: $500. Coverage Form: Occurrence...",
            },
        ],
    },
    {
        "keywords": ["theft"],
        "answer": (
            "Yes — your Business Personal Property is covered against theft. "
            "Your ACORD 140 lists Causes of Loss as 'Special,' which is the "
            "broadest commercial form and includes theft. The $95,000 BPP limit "
            "applies, with a $1,000 deductible per loss."
        ),
        "sources": [
            {
                "source": "ACORD_140_filled.pdf",
                "page": 1,
                "preview": "Causes of Loss: Special. Valuation: Replacement Cost. Coinsurance: 80%. Deductible: $1,000...",
            }
        ],
    },
    {
        "keywords": ["liquor"],
        "answer": (
            "You do NOT currently have liquor liability coverage. Your ACORD 126 "
            "explicitly states 'Liquor / beer / wine sales: No' under additional "
            "exposures. If you plan to add beer or wine service, you'll need a "
            "Liquor Liability endorsement before serving."
        ),
        "sources": [
            {
                "source": "ACORD_126_filled.pdf",
                "page": 2,
                "preview": "Additional Exposures — Liquor / beer / wine sales: No. Catering / off-premises operations: No...",
            }
        ],
    },
    {
        "keywords": ["acord", "126", "19"],
        "answer": (
            "ACORD 126 Question 19 asks whether you have a 'formal, written safety "
            "and security policy in effect.' Underwriters use this to assess loss "
            "frequency risk — businesses with documented safety policies are "
            "statistically less likely to file premises liability claims. Yours "
            "is currently unanswered. Uploading your written incident-response "
            "procedure could reduce your renewal premium 4-6%."
        ),
        "sources": [
            {
                "source": "ACORD_126_blank.pdf",
                "page": 4,
                "preview": "19. IS THERE A FORMAL, WRITTEN SAFETY AND SECURITY POLICY IN EFFECT?",
            }
        ],
    },
    {
        "keywords": ["claim", "history"],
        "answer": (
            "You have one claim in your 3-year loss history: a customer slip-and-fall "
            "in 2024 that paid $1,250. No claims in 2023 or 2025. Your post-claim "
            "mitigations (wet floor signage, hourly floor checks) are noted in "
            "ACORD 126 question 18 — these strengthen your renewal negotiation "
            "position."
        ),
        "sources": [
            {
                "source": "ACORD_125_filled.pdf",
                "page": 2,
                "preview": "Loss History — 2024: 1 claim, $1,250 paid. Customer slip on wet floor near entrance during rain...",
            }
        ],
    },
    {
        "keywords": ["coverage", "limit"],
        "answer": (
            "Your main coverage limits are: General Liability — $1M per occurrence / "
            "$2M aggregate, $2M products/completed ops aggregate. Property — $95,000 "
            "Business Personal Property, $120,000 Business Income, $5,000 spoilage. "
            "Workers Compensation runs under a separate carrier."
        ),
        "sources": [
            {
                "source": "ACORD_126_filled.pdf",
                "page": 1,
                "preview": "Each Occurrence Limit: $1,000,000. General Aggregate: $2,000,000. Products/Completed Ops: $2,000,000...",
            },
            {
                "source": "ACORD_140_filled.pdf",
                "page": 1,
                "preview": "BPP Limit: $95,000. Business Income: $120,000. Spoilage: $5,000...",
            },
        ],
    },
    {
        "keywords": ["premium"],
        "answer": (
            "Your renewal premium is $1,940 — up 8% from $1,790 last year and 28% "
            "above your 2023 baseline of $1,520. Carrier-stated reason on the "
            "renewal notice is 'annual rate adjustment per filing.' Three of your "
            "ACORD form answers are leaving rate credits on the table. See your "
            "action list for specifics."
        ),
        "sources": [
            {
                "source": "renewal_quote_2026.pdf",
                "page": 1,
                "preview": "Renewal Premium: $1,940.00. Prior term: $1,790.00. Rate change: +8.4%...",
            }
        ],
    },
    {
        "keywords": ["naics"],
        "answer": (
            "Your NAICS code is 722515 (Snack and Nonalcoholic Beverage Bars) — "
            "this is correctly classified for a coffee shop without alcohol "
            "service. If you were misclassified as 722511 (Full-Service Restaurant), "
            "your premium would be approximately 30% higher. Worth verifying this "
            "hasn't drifted at renewal."
        ),
        "sources": [
            {
                "source": "ACORD_125_filled.pdf",
                "page": 1,
                "preview": "NAICS Code: 722515. SIC Code: 5812. Description: Coffee shop and small bakery...",
            }
        ],
    },
]


# Suggestions shown when no canned answer matches.
SUGGESTED_QUESTIONS = [
    "What is my deductible?",
    "Am I covered for theft?",
    "What does ACORD 126 question 19 mean?",
    "What's my claim history?",
    "Why did my premium go up?",
]


# ---------------------------------------------------------------------------
# Data shapes (unchanged from real RAG so frontend works identically)
# ---------------------------------------------------------------------------

@dataclass
class Source:
    source: str
    page: int
    preview: str


@dataclass
class AskResult:
    answer: str
    sources: list[Source] = field(default_factory=list)
    chunks_retrieved: int = 0

    def to_dict(self) -> dict:
        return {
            "answer": self.answer,
            "sources": [
                {"source": s.source, "page": s.page, "preview": s.preview}
                for s in self.sources
            ],
            "chunks_retrieved": self.chunks_retrieved,
        }


# ---------------------------------------------------------------------------
# RAG class — same interface as the real one
# ---------------------------------------------------------------------------

class RAG:
    """Fake RAG. Same shape as real RAG so endpoints don't change."""

    def __init__(self, corpus_dir: Optional[Path] = None):
        # corpus_dir kept for API compatibility; not used.
        self.corpus_dir = corpus_dir
        self.chunks = CANNED_QA  # so list_corpus has something to count

    def reload(self) -> int:
        return len(CANNED_QA)

    def ask(self, query: str, top_k: int = 5) -> AskResult:
        normalized = query.lower().strip()

        # Match the first canned answer where all required keywords appear.
        for entry in CANNED_QA:
            if all(kw.lower() in normalized for kw in entry["keywords"]):
                sources = [Source(**s) for s in entry["sources"]]
                return AskResult(
                    answer=entry["answer"],
                    sources=sources,
                    chunks_retrieved=len(sources),
                )

        # Fallback — no match. Make it sound grounded, not broken.
        suggestions = "\n".join(f"  • {q}" for q in SUGGESTED_QUESTIONS)
        return AskResult(
            answer=(
                f"I can't find that specifically in your policy documents. "
                f"Here are some questions I can answer well:\n\n{suggestions}"
            ),
            sources=[],
            chunks_retrieved=0,
        )

    def save_uploaded_pdf(self, filename: str, contents: bytes) -> Path:
        # No-op in fake mode but maintain the interface.
        return Path(filename)

    def list_corpus(self) -> list[dict]:
        # Return the filenames cited in canned answers so the corpus panel looks real.
        seen = {}
        for entry in CANNED_QA:
            for s in entry["sources"]:
                seen.setdefault(s["source"], 0)
                seen[s["source"]] += 1
        return [
            {"filename": name, "size_bytes": 0, "chunks": count}
            for name, count in seen.items()
        ]
