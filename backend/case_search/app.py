"""
Indian Case Law Search Backend
================================
Dataset : KanoonGPT/indian-case-laws  (HuggingFace)
Search  : BM25 + TF-IDF bigrams + Sentence-BERT (optional dense reranker)
Rules   : No LLM API calls.  HuggingFace dataset API is fine.

Quick start
-----------
    pip install -r requirements.txt
    python app.py          # http://localhost:5050

On first run:
  1. Downloads the dataset from HuggingFace
  2. Builds BM25 + TF-IDF indexes  (cached to ./cache/)
  3. Optionally encodes all docs with Sentence-BERT  (cached to ./cache/)
  Subsequent runs load everything from cache – near-instant startup.
"""

from __future__ import annotations
import os
import logging
import pickle
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── app ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── global state (populated once at startup) ──────────────────────────────────
_records:    List[Dict] = []
_corpus:     List[str]  = []
_tfidf_vec  = None
_tfidf_mat  = None
_bm25       = None
_sbert      = None
_embeddings: Optional[np.ndarray] = None

# ── config ────────────────────────────────────────────────────────────────────
DATASET_NAME   = "KanoonGPT/indian-case-laws"

# Three configs available:
#   "sample"     – small representative subset  (dev / demo)
#   "structured" – full metadata for all courts  (production)
#   "full"       – structured + judgment text    (large; may not be released yet)
DATASET_CONFIG = "default"  # ← set via env var: export DATASET_CONFIG=structured
DATASET_SPLIT  = "train"

MAX_RECORDS    = 100_000

USE_SBERT      = True
SBERT_MODEL    = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
SBERT_TRUNCATE = 256

CACHE_DIR = Path("./cache")

# ── text cleaning ─────────────────────────────────────────────────────────────
_LEGAL_NOISE = {
    "hon", "ble", "vs", "versus", "re", "suo", "motu",
    "whereas", "hereinafter", "aforesaid", "pursuant", "thereof",
    "therein", "thereto", "wherein", "whereby", "herein",
    "petitioner", "respondent", "appellant", "appellee",
    "said", "shall", "may", "upon", "within", "without",
}
_RE_URL   = re.compile(r"https?://\S+")
_RE_NOISE = re.compile(r"[^\w\s.\-/(),]")
_RE_WS    = re.compile(r"\s+")


def _clean(text: str, max_chars: int = 4_000) -> str:
    if not text:
        return ""
    t = str(text)[:max_chars]
    t = _RE_URL.sub(" ", t)
    t = _RE_NOISE.sub(" ", t)
    t = _RE_WS.sub(" ", t).strip().lower()
    return t


def _build_doc(row: Dict) -> str:
    """
    Merge fields into one searchable string.
    Title repeated 3× and headnote 2× to upweight them vs raw body text.
    """
    title      = row.get("case_title") or ""
    headnote   = row.get("headnote_text") or ""
    body       = row.get("indexable_text") or ""
    citation   = row.get("neutral_citation") or row.get("law_report_citation") or ""
    court      = row.get("court_name") or ""
    petitioner = row.get("party_petitioner") or ""
    respondent = row.get("party_respondent") or ""
    dispo      = row.get("disposition_text") or ""

    parts = [
        title, title, title,       # ×3 weight
        headnote, headnote,        # ×2 weight
        citation, court,
        petitioner, respondent, dispo,
        body[:3_000],
    ]
    return _clean(" ".join(p for p in parts if p))


# ── dataset loading ────────────────────────────────────────────────────────────
def _load_records() -> List[Dict]:
    CACHE_DIR.mkdir(exist_ok=True)
    cache_file = CACHE_DIR / f"records_{DATASET_CONFIG}.pkl"

    if cache_file.exists():
        log.info("Loading records from cache: %s", cache_file)
        with open(cache_file, "rb") as fh:
            return pickle.load(fh)

    log.info(
        "Downloading  %s  (config=%s, split=%s) …",
        DATASET_NAME, DATASET_CONFIG, DATASET_SPLIT,
    )
    try:
        from datasets import load_dataset
        ds = load_dataset(
            DATASET_NAME,
            name=DATASET_CONFIG,   # ← config: "sample" | "structured" | "full"
            split=DATASET_SPLIT,
            trust_remote_code=True,
            token=os.getenv("HF_TOKEN"),
        )
    except Exception as exc:
        log.error("Dataset download failed: %s", exc)
        log.error(
            "Make sure:  pip install datasets huggingface_hub\n"
            "If gated:   export HF_TOKEN=hf_xxxxxxxx"
        )
        sys.exit(1)

    records: List[Dict] = []
    for i, row in enumerate(ds):
        if i >= MAX_RECORDS:
            break
        records.append(dict(row))

    log.info("Loaded %d records.", len(records))
    with open(cache_file, "wb") as fh:
        pickle.dump(records, fh)
    log.info("Cached → %s", cache_file)
    return records


# ── TF-IDF ────────────────────────────────────────────────────────────────────
def _build_tfidf(corpus: List[str]) -> None:
    global _tfidf_vec, _tfidf_mat
    cache = CACHE_DIR / f"tfidf_{DATASET_CONFIG}.pkl"
    if cache.exists():
        log.info("Loading TF-IDF from cache …")
        with open(cache, "rb") as fh:
            _tfidf_vec, _tfidf_mat = pickle.load(fh)
        return

    log.info("Building TF-IDF index (%d docs) …", len(corpus))
    from sklearn.feature_extraction.text import TfidfVectorizer
    _tfidf_vec = TfidfVectorizer(
        max_features=300_000,
        ngram_range=(1, 3),
        sublinear_tf=True,
        min_df=2,
        max_df=0.90,
        stop_words=list(_LEGAL_NOISE),
        strip_accents="unicode",
    )
    _tfidf_mat = _tfidf_vec.fit_transform(corpus)
    log.info("TF-IDF: Fitting vectorizer...")
    with open(cache, "wb") as fh:
        pickle.dump((_tfidf_vec, _tfidf_mat), fh)
    log.info("TF-IDF cached  shape=%s", _tfidf_mat.shape)


# ── BM25 ──────────────────────────────────────────────────────────────────────
def _build_bm25(corpus: List[str]) -> None:
    global _bm25
    cache = CACHE_DIR / f"bm25_{DATASET_CONFIG}.pkl"
    if cache.exists():
        log.info("Loading BM25 from cache …")
        with open(cache, "rb") as fh:
            _bm25 = pickle.load(fh)
        return

    log.info("Building BM25 index …")
    from rank_bm25 import BM25Okapi
    _bm25 = BM25Okapi([doc.split() for doc in corpus], k1=1.6, b=0.75)
    log.info("BM25: Tokenizing documents...")
    with open(cache, "wb") as fh:
        pickle.dump(_bm25, fh)
    log.info("BM25 cached.")


# ── Sentence-BERT ─────────────────────────────────────────────────────────────
def _build_sbert(corpus: List[str]) -> None:
    global _sbert, _embeddings
    cache = CACHE_DIR / f"embeddings_{DATASET_CONFIG}.npy"
    if cache.exists():
        log.info("Loading embeddings from cache …")
        _embeddings = np.load(str(cache))
        try:
            from sentence_transformers import SentenceTransformer
            _sbert = SentenceTransformer(SBERT_MODEL)
        except Exception as exc:
            log.warning("SBERT model reload failed (%s); dense layer disabled.", exc)
            _embeddings = None
        return

    try:
        from sentence_transformers import SentenceTransformer
        log.info("Encoding corpus with SBERT (%s) …", SBERT_MODEL)
        _sbert = SentenceTransformer(SBERT_MODEL)
        snippets = [doc[:SBERT_TRUNCATE] for doc in corpus]
        _embeddings = _sbert.encode(
            snippets,
            batch_size=256,
            show_progress_bar=True,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        np.save(str(cache), _embeddings)
        log.info("Embeddings cached  shape=%s", _embeddings.shape)
    except Exception as exc:
        log.warning("SBERT unavailable (%s). Dense reranking disabled.", exc)
        _embeddings = None
        _sbert = None


# ── source filter mask ────────────────────────────────────────────────────────
def _source_mask(source: str) -> Optional[np.ndarray]:
    rules = {
        "supreme_court": lambda r: "supreme" in (r.get("court_name") or "").lower(),
        "high_court":    lambda r: "high court" in (r.get("court_name") or "").lower(),
        "constitution":  lambda r: any(
            kw in ((r.get("indexable_text") or "") + (r.get("headnote_text") or "")).lower()
            for kw in ["constitution of india", "article 14", "article 19", "article 21",
                       "fundamental right", "writ petition", "habeas corpus"]
        ),
        "ipc": lambda r: any(
            kw in ((r.get("indexable_text") or "") + (r.get("headnote_text") or "")).lower()
            for kw in ["indian penal code", " ipc", "section 302", "section 420",
                       "section 376", "section 307", "section 498"]
        ),
        "bns": lambda r: any(
            kw in ((r.get("indexable_text") or "") + (r.get("headnote_text") or "")).lower()
            for kw in ["bharatiya nyaya sanhita", "bns 2023", "bns,", " bns "]
        ),
    }
    pred = rules.get(source)
    if pred is None:
        return None
    return np.array([1.0 if pred(r) else 0.0 for r in _records])


# ── hybrid search ─────────────────────────────────────────────────────────────
def _search(query: str, source: str = "all", top_k: int = 20) -> List[Tuple[int, float]]:
    """
    Hybrid score:
      SBERT available  →  0.35·BM25 + 0.35·TF-IDF + 0.30·SBERT
      SBERT missing    →  0.50·BM25 + 0.50·TF-IDF
    """
    q_clean = _clean(query)
    n = len(_records)

    # BM25
    bm25_raw  = np.array(_bm25.get_scores(q_clean.split()), dtype=np.float32)
    bm25_norm = bm25_raw / (bm25_raw.max() + 1e-9)

    # TF-IDF cosine
    from sklearn.metrics.pairwise import cosine_similarity
    q_vec     = _tfidf_vec.transform([q_clean])
    tfidf_cos = cosine_similarity(q_vec, _tfidf_mat).flatten().astype(np.float32)

    # Dense (SBERT)
    if _sbert is not None and _embeddings is not None:
        q_emb      = _sbert.encode(
            [query[:SBERT_TRUNCATE]],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        dense_cos  = (_embeddings @ q_emb.T).flatten().astype(np.float32)
        dense_norm = (dense_cos + 1.0) / 2.0
        hybrid     = 0.35 * bm25_norm + 0.35 * tfidf_cos + 0.30 * dense_norm
    else:
        hybrid = 0.50 * bm25_norm + 0.50 * tfidf_cos

    # Source filter
    if source != "all":
        mask = _source_mask(source)
        if mask is not None:
            hybrid = hybrid * mask

    # Top-k
    k      = min(top_k * 3, n)
    top_i  = np.argpartition(hybrid, -k)[-k:]
    top_i  = top_i[np.argsort(hybrid[top_i])[::-1]]
    return [(int(i), float(hybrid[i])) for i in top_i if hybrid[i] > 1e-6]


# ── record → API payload ──────────────────────────────────────────────────────
_LEGAL_KEYWORDS = [
    "bail", "anticipatory bail", "murder", "rape", "fraud", "cheque bounce",
    "contempt", "habeas corpus", "right to privacy", "freedom of speech",
    "right to life", "property", "divorce", "custody", "maintenance",
    "acquittal", "conviction", "pil", "writ petition", "injunction",
    "specific performance", "defamation", "contract", "negligence",
    "intellectual property", "arbitration", "insolvency", "tax",
    "section 302", "section 420", "section 376", "section 307",
    "article 21", "article 19", "article 14", "article 226",
]


def _infer_source(row: Dict) -> str:
    court = (row.get("court_name") or "").lower()
    text  = ((row.get("indexable_text") or "") + (row.get("headnote_text") or "")).lower()
    if "supreme" in court:        return "supreme_court"
    if "high court" in court:     return "high_court"
    if "constitution" in text:    return "constitution"
    if " ipc" in text:            return "ipc"
    if " bns" in text:            return "bns"
    return "high_court"


def _extract_tags(row: Dict) -> List[str]:
    combined = (
        (row.get("indexable_text") or "") + " " + (row.get("headnote_text") or "")
    ).lower()
    return [kw for kw in _LEGAL_KEYWORDS if kw in combined][:6]


def _kanoon_url(row: Dict) -> str:
    title = row.get("case_title") or ""
    q     = "+".join(title.split()[:6])
    return f"https://indiankanoon.org/search/?formInput={q}" if q else "https://indiankanoon.org"


def _relevance_pct(score: float) -> int:
    pct = int(score * 120 + 25)
    return max(30, min(99, pct))


def _row_to_case(row: Dict, score: float) -> Dict:
    summary = (
        (row.get("headnote_text") or "")[:700]
        or (row.get("indexable_text") or "")[:500]
        or "No summary available."
    )
    return {
        "id":          str(row.get("id") or row.get("case_metadata_id") or row.get("parser_record_id") or ""),
        "title":       row.get("case_title") or "Untitled Case",
        "court":       row.get("court_name") or "",
        "year":        str(row.get("decision_year") or row.get("citation_year") or ""),
        "citation":    row.get("neutral_citation") or row.get("law_report_citation") or "",
        "summary":     summary,
        "source":      _infer_source(row),
        "tags":        _extract_tags(row),
        "relevance":   _relevance_pct(score),
        "judges":      row.get("coram_members_text") or row.get("presiding_judge") or "",
        "bench":       row.get("bench_name") or "",
        "petitioner":  row.get("party_petitioner") or "",
        "respondent":  row.get("party_respondent") or "",
        "docket":      row.get("docket_number") or "",
        "cnr":         row.get("cnr_number") or "",
        "disposition": row.get("disposition_text") or "",
        "pdf_url":     row.get("source_pdf_s3_url") or "",
        "json_url":    row.get("source_json_s3_url") or "",
        "kanoon_url":  _kanoon_url(row),
    }


# ── routes ────────────────────────────────────────────────────────────────────
@app.route("/api/search")
def route_search():
    query  = request.args.get("q", "").strip()
    source = request.args.get("source", "all").strip()
    try:
        limit = max(1, min(int(request.args.get("limit", 10)), 30))
    except ValueError:
        limit = 10

    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400
    if not _records:
        return jsonify({"error": "Index not ready — server is still starting."}), 503

    hits  = _search(query, source=source, top_k=limit + 15)
    cases = [_row_to_case(_records[i], sc) for i, sc in hits]

    seen, unique = set(), []
    for c in cases:
        key = re.sub(r"\s+", " ", c["title"].lower().strip())
        if key not in seen:
            seen.add(key)
            unique.append(c)
        if len(unique) >= limit:
            break

    return jsonify({"query": query, "source": source, "total": len(unique), "results": unique})


@app.route("/api/case/<path:case_id>")
def route_case(case_id: str):
    for row in _records:
        rid = str(row.get("id") or row.get("case_metadata_id") or row.get("parser_record_id") or "")
        if rid == case_id:
            return jsonify(_row_to_case(row, 1.0))
    return jsonify({"error": "Case not found"}), 404


@app.route("/api/health")
def route_health():
    return jsonify({
        "status":         "ok",
        "dataset_config": DATASET_CONFIG,
        "indexed":        len(_records),
        "tfidf_ready":    _tfidf_mat is not None,
        "bm25_ready":     _bm25 is not None,
        "sbert_ready":    _embeddings is not None,
    })


# ── startup ───────────────────────────────────────────────────────────────────
def startup() -> None:
    global _records, _corpus
    log.info("══════════════════════════════════════════")
    log.info("   Indian Case Law Search  —  starting    ")
    log.info("══════════════════════════════════════════")
    _records = _load_records()
    _corpus = []
    for i, r in enumerate(_records):
        if i % 5000 == 0:
            log.info(f"Processing corpus: {i}/{len(_records)}")
        _corpus.append(_build_doc(r))
    _build_tfidf(_corpus)
    _build_bm25(_corpus)
    if USE_SBERT:
        _build_sbert(_corpus)
    else:
        log.info("SBERT disabled (USE_SBERT=False).")
    log.info("━━━  Ready  —  %d cases indexed  ━━━", len(_records))
    log.info("     http://localhost:5050/api/search?q=right+to+privacy")


if __name__ == "__main__":
    startup()
    app.run(host="0.0.0.0", port=5050, debug=False, threaded=True)
