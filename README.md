<p align="center">
  <img src="https://img.shields.io/badge/NyayaAI-Legal_Research_Assistant-blueviolet?style=for-the-badge&logo=scales" alt="NyayaAI Badge" />
</p>

<h1 align="center">⚖️ NyayaAI</h1>

<p align="center">
  <strong>AI-Powered Legal Research Assistant for Indian Law</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-green?logo=opensourceinitiative" alt="License" />
  <img src="https://img.shields.io/badge/Cost-Zero-brightgreen" alt="Zero Cost" />
</p>

<p align="center">
  A free, privacy-first legal research platform that combines a <strong>conversational AI chatbot</strong> (ReAct agent) with a <strong>hybrid case law search engine</strong> indexing <strong>100,000+ Indian court judgements</strong>. No paid API keys required.
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#1-frontend-setup)
  - [Case Search Backend Setup](#2-case-search-backend-setup)
  - [LLM Chat Backend Setup (Kaggle)](#3-llm-chat-backend-setup-kaggle)
- [API Reference](#-api-reference)
- [Search Algorithm](#-search-algorithm)
- [Supported Languages](#-supported-languages)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Disclaimer](#-disclaimer)
- [License](#-license)

---

## 🔍 Overview

In India, approximately **70% of the population** lacks basic legal awareness, and legal consultation fees are beyond the reach of many citizens. Existing legal research platforms (Manupatra, SCC Online, Westlaw India) charge **₹15,000–₹50,000/year**, operate only in English, and require complex Boolean search syntax.

**NyayaAI** bridges this gap by providing:

- 🤖 A **conversational AI assistant** that explains legal concepts in plain language
- 🔎 A **hybrid search engine** that finds relevant case law using BM25 + TF-IDF + Sentence-BERT
- 🌐 **Multilingual support** across 9 Indian languages
- 🔒 **Privacy-first design** — no personal data leaves the system
- 💰 **Zero cost** — runs entirely on open-source models and free compute

---

## ✨ Key Features

### AI Legal Assistant (Chat)
| Feature | Description |
|---------|-------------|
| 💬 Natural Language Q&A | Ask legal questions in plain English or any supported Indian language |
| 🧠 Chain-of-Thought Reasoning | Transparent reasoning steps displayed via ReAct agent architecture |
| 🎙️ Voice Input | Dictate queries using OpenAI Whisper multilingual transcription |
| 🔊 Text-to-Speech | Listen to AI responses with high-quality browser voices |
| 📋 Copy to Clipboard | One-click copy of any AI response |
| 🌙 Dark/Light Theme | Toggle between themes for comfortable reading |

### Case Law Search
| Feature | Description |
|---------|-------------|
| 🔎 Hybrid Search | Combines BM25, TF-IDF (trigrams), and Sentence-BERT for maximum relevance |
| 📊 Relevance Scoring | Percentage-based match display for each result |
| 🏛️ Source Filtering | Filter by Supreme Court, High Courts, IPC, BNS 2023, Constitution |
| 📄 Case Details | Full case view with citation, judges, disposition, and bench info |
| 🔗 Cross-Reference | Direct links to Indian Kanoon for original judgement text |
| 📥 PDF Download | Download source PDFs when available |
| 🏷️ Auto-Tagging | Intelligent keyword tags extracted from case content |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Sidebar     │  │   Topbar     │  │  ToastContainer  │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                    │
│  ┌──────┴───────────────────────────────────────┐           │
│  │              React Router v6                  │           │
│  │  ┌──────────────┐  ┌─────────────────────┐   │           │
│  │  │  ChatPage    │  │  CaseSearchPage     │   │           │
│  │  └──────┬───────┘  └──────────┬──────────┘   │           │
│  └─────────┼─────────────────────┼──────────────┘           │
└────────────┼─────────────────────┼───────────────────────────┘
             │                     │
     ┌───────▼────────┐   ┌───────▼──────────────────────────┐
     │  Kaggle LLM    │   │  Flask Backend (port 5050)        │
     │  Backend via    │   │  ┌────────┐ ┌──────┐ ┌────────┐ │
     │  ngrok tunnel   │   │  │ BM25   │ │TF-IDF│ │ SBERT  │ │
     │  (port 8000)    │   │  └────────┘ └──────┘ └────────┘ │
     │                 │   │  Dataset: KanoonGPT/indian-      │
     │  /api/chat      │   │  case-laws (HuggingFace)         │
     │  /api/transcribe│   │  /api/search  /api/health        │
     └─────────────────┘   └──────────────────────────────────┘
```

The system uses a **dual-backend architecture**:

1. **Case Search API** — A Flask server running locally (or on a VPS) that handles hybrid case law retrieval with cached indexes for near-instant startup after first run.
2. **LLM Chat Backend** — A Kaggle notebook with free GPU that runs the ReAct agent and Whisper transcription, exposed to the frontend via ngrok tunneling.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with functional components & hooks |
| **Vite 5** | Build tool with HMR and fast production builds |
| **React Router v6** | Client-side routing (Chat ↔ Case Search) |
| **Lucide React** | Icon library |
| **Web Speech API** | Browser-native text-to-speech |
| **Vanilla CSS** | Custom styling with CSS variables & dark mode |

### Backend — Case Search
| Technology | Purpose |
|------------|---------|
| **Flask 3** | Lightweight WSGI web server |
| **flask-cors** | Cross-origin resource sharing |
| **rank_bm25** | Okapi BM25 probabilistic ranking |
| **scikit-learn** | TF-IDF vectorization (trigrams, sublinear TF) |
| **sentence-transformers** | Dense semantic search (SBERT) |
| **HuggingFace Datasets** | Dataset loading & management |
| **NumPy** | Numerical operations for scoring |

### Backend — LLM Chat
| Technology | Purpose |
|------------|---------|
| **Kaggle Notebooks** | Free GPU compute for LLM inference |
| **OpenAI Whisper** | Multilingual speech-to-text |
| **ngrok** | Tunneling to expose Kaggle backend |
| **ReAct Agent** | Reasoning + Acting prompting framework |

### Dataset
| Source | Details |
|--------|---------|
| **KanoonGPT/indian-case-laws** | 100,000+ Indian court judgements from HuggingFace |

---

## 📂 Project Structure

```
nyayaai/
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                # Root component with routing & global state
│   │   ├── main.jsx               # Entry point
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── Topbar.jsx         # Theme toggle, language selector, voice toggle
│   │   │   └── ToastContainer.jsx # Toast notification system
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx       # AI Legal Assistant chat interface
│   │   │   └── CaseSearchPage.jsx # Case law search interface
│   │   ├── data/
│   │   │   └── mockData.js        # Fallback mock data for offline dev
│   │   └── styles/
│   │       └── global.css         # Design system, themes, responsive styles
│   ├── .env                       # API endpoint configuration
│   ├── package.json               # Node dependencies
│   └── vite.config.js             # Vite configuration
│
├── backend/
│   ├── case_search/
│   │   ├── app.py                 # Flask search API (BM25 + TF-IDF + SBERT)
│   │   ├── requirements.txt       # Python dependencies
│   │   └── cache/                 # Auto-generated index caches (gitignored)
│   └── chatpage/
│       └── chatpage.ipynb         # Kaggle notebook for LLM + Whisper backend
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | ≥ 18.x |
| **npm** | ≥ 9.x |
| **Python** | ≥ 3.10 |
| **pip** | Latest |
| **Git** | Latest |

### 1. Frontend Setup

```bash
# Clone the repository
git clone https://github.com/Manogna1507/Legal-QnA-Bot.git
cd Legal-QnA-Bot/frontend

# Install dependencies
npm install

# Configure environment variables
# Edit .env and set your backend URLs:
#   VITE_API_URL=<your-ngrok-chat-backend-url>
#   SEARCH_API_URL=http://localhost:5050

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173` by default.

### 2. Case Search Backend Setup

```bash
cd backend/case_search

# Create and activate a virtual environment (recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

**First run** will:
1. Download the dataset from HuggingFace (~2-5 minutes depending on connection)
2. Build BM25 + TF-IDF indexes (~3-5 minutes for 100K records)
3. Encode documents with Sentence-BERT (~5-10 minutes, GPU recommended)
4. Cache everything to `./cache/` for instant subsequent startups

The search API will be available at `http://localhost:5050`.

> **💡 Tip:** Set `USE_SBERT = False` in `app.py` if you want faster startup without GPU. The search will still work using BM25 + TF-IDF.

### 3. LLM Chat Backend Setup (Kaggle)

1. Open `backend/chatpage/chatpage.ipynb` in [Kaggle Notebooks](https://www.kaggle.com/code)
2. Enable **GPU accelerator** in notebook settings
3. Run all cells — the notebook will:
   - Load the LLM and Whisper models
   - Start a Flask server on port 8000
   - Create an ngrok tunnel and print the public URL
4. Copy the ngrok URL and update `VITE_API_URL` in `frontend/.env`

---

## 📡 API Reference

### Case Search API (`localhost:5050`)

#### `GET /api/search`

Search for Indian case law using hybrid retrieval.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | *(required)* | Search query text |
| `source` | string | `all` | Filter: `all`, `supreme_court`, `high_court`, `ipc`, `bns`, `constitution` |
| `limit` | integer | `10` | Max results (1–30) |

**Example:**
```
GET /api/search?q=right+to+privacy&source=supreme_court&limit=5
```

**Response:**
```json
{
  "query": "right to privacy",
  "source": "supreme_court",
  "total": 5,
  "results": [
    {
      "id": "12345",
      "title": "Justice K.S. Puttaswamy vs Union Of India",
      "court": "Supreme Court of India",
      "year": "2017",
      "citation": "AIR 2017 SC 4161",
      "summary": "...",
      "source": "supreme_court",
      "tags": ["right to privacy", "article 21", "fundamental right"],
      "relevance": 97,
      "judges": "...",
      "kanoon_url": "https://indiankanoon.org/search/?formInput=..."
    }
  ]
}
```

#### `GET /api/case/:case_id`

Get full details for a specific case.

#### `GET /api/health`

Health check endpoint returning index status.

**Response:**
```json
{
  "status": "ok",
  "dataset_config": "default",
  "indexed": 100000,
  "tfidf_ready": true,
  "bm25_ready": true,
  "sbert_ready": true
}
```

---

## 🧮 Search Algorithm

NyayaAI uses a **three-layer hybrid scoring** approach for maximum relevance:

```
┌─────────────────────────────────────────────────────┐
│              Hybrid Score Computation                │
│                                                     │
│  With SBERT:                                        │
│    Score = 0.35 × BM25 + 0.35 × TF-IDF + 0.30 × SBERT │
│                                                     │
│  Without SBERT:                                     │
│    Score = 0.50 × BM25 + 0.50 × TF-IDF             │
└─────────────────────────────────────────────────────┘
```

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| **Sparse (Lexical)** | BM25 Okapi (k1=1.6, b=0.75) | Term frequency + document length normalization |
| **Sparse (Statistical)** | TF-IDF (trigrams, sublinear TF, 300K features) | N-gram overlap with legal noise filtering |
| **Dense (Semantic)** | Sentence-BERT (`paraphrase-multilingual-MiniLM-L12-v2`) | Semantic meaning similarity via cosine distance |

**Title and headnote boosting:** Case titles are weighted 3× and headnotes 2× during indexing to improve relevance for title/concept searches.

---

## 🌐 Supported Languages

| Language | Code | Input | Output |
|----------|------|-------|--------|
| 🇬🇧 English | `en` | ✅ | ✅ |
| 🇮🇳 Hindi | `hi` | ✅ | ✅ |
| 🇮🇳 Telugu | `te` | ✅ | ✅ |
| 🇮🇳 Tamil | `ta` | ✅ | ✅ |
| 🇮🇳 Bengali | `bn` | ✅ | ✅ |
| 🇮🇳 Marathi | `mr` | ✅ | ✅ |
| 🇮🇳 Gujarati | `gu` | ✅ | ✅ |
| 🇮🇳 Kannada | `kn` | ✅ | ✅ |
| 🇮🇳 Malayalam | `ml` | ✅ | ✅ |

Voice input via Whisper supports all the above languages. Text-to-speech availability depends on the user's browser and installed system voices.

---

## 📸 Screenshots

> *Coming soon — run the application locally to explore the UI.*

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m "Add my feature"`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and component patterns
- Keep the system **zero-cost** — no paid APIs
- Maintain **privacy-first** principles — no user data transmission to third parties
- Test both dark and light themes when making UI changes
- Ensure the search backend works with `USE_SBERT = False` as a fallback

---

## ⚠️ Disclaimer

> **NyayaAI provides legal information for educational purposes only. It does NOT constitute legal advice.** Always consult a qualified legal professional for specific legal matters. The AI responses should be verified independently and are not a substitute for professional legal counsel.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for accessible legal research in India
</p>
