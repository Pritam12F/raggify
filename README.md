# 🧠 Raggify

> **Chat with any PDF or website using AI — powered by RAG (Retrieval-Augmented Generation)**

Raggify lets you upload documents or drop in a URL, and instantly start chatting with that content using a locally-running LLM. No OpenAI API keys. No cloud costs. Just pure, local AI magic. ✨

---

## 🚀 Features

- 📄 **PDF Ingestion** — Upload any PDF and extract its content into a searchable vector store
- 🌐 **Website/URL Ingestion** — Recursively crawl entire websites using Puppeteer, indexing every reachable page
- 💬 **Persistent Chat History** — Every conversation is saved and resumable, per document
- 🔍 **Semantic Search via RAG** — Queries are embedded and matched against the most relevant chunks before being sent to the LLM
- 🧩 **Multi-document Support** — Index multiple sources and chat with each independently
- 🏃 **Fully Local** — Powered by Ollama; no external LLM API required
- ⚡ **Real-time Responses** — Streaming LLM output for a snappy chat experience

---

## 🛠️ Tech Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| 🖥️ Frontend        | Next.js 16, React 19, TypeScript         |
| 🎨 UI              | shadcn/ui, Tailwind CSS                  |
| 🤖 AI / LLM        | Ollama (local), LangChain.js             |
| 🗃️ Vector Store    | Qdrant                                   |
| 🗄️ Database        | PostgreSQL + Prisma ORM                  |
| 🕷️ Web Crawler     | Puppeteer (recursive, deduped via `Set`) |
| 📦 Package Manager | pnpm                                     |
| 🐳 Infra           | Docker Compose (Qdrant + Postgres)       |

---

## 🏗️ Architecture

```
User Input (PDF / URL)
        │
        ▼
┌───────────────────┐
│  Ingestion Layer  │  ← PDF parser / Puppeteer crawler
└────────┬──────────┘
         │ Raw text chunks
         ▼
┌───────────────────┐
│  Embedding Model  │  ← Ollama (nomic-embed-text)
└────────┬──────────┘
         │ Vectors
         ▼
┌───────────────────┐
│     Qdrant DB     │  ← Vector similarity search
└────────┬──────────┘
         │ Top-k relevant chunks (context)
         ▼
┌───────────────────┐
│   LLM (Ollama)    │  ← Llama 3.1 8B or similar
└────────┬──────────┘
         │ Answer
         ▼
   Chat UI (Next.js)
```

---

## 📂 Project Structure

```
raggify/
├── prisma/              # Prisma schema & migrations
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router (pages & API routes)
│   ├── components/      # React UI components
│   └── lib/             # LangChain, Qdrant, Prisma clients & utils
├── docker-compose.yml   # Qdrant + PostgreSQL services
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for Qdrant + Postgres)
- [Ollama](https://ollama.ai/) installed and running locally

### 1. Clone the repo

```bash
git clone https://github.com/Pritam12F/raggify.git
cd raggify
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

This spins up:

- 🗃️ **Qdrant** on `localhost:6333`
- 🐘 **PostgreSQL** on `localhost:5432`

### 4. Set up environment variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/raggify"
QDRANT_URL="http://localhost:6333"
```

### 5. Run Prisma migrations

```bash
pnpm prisma migrate dev
```

### 6. Pull Ollama models

```bash
ollama pull llama3.2:1b      # LLM for chat
ollama pull mxbai-embed-large:latest  # Embedding model
```

### 7. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔄 How It Works

### 📄 PDF Upload

1. User uploads a PDF via the UI
2. The file is parsed using LangChain's `PDFLoader`
3. Content is split into overlapping chunks
4. Each chunk is embedded via Ollama (`nomic-embed-text`)
5. Embeddings are stored in Qdrant with metadata
6. A document record is saved in PostgreSQL via Prisma

### 🌐 Website Crawling

1. User provides a root URL
2. Puppeteer launches a headless browser and loads the page
3. All internal links are extracted from `<a href>` tags
4. The crawler recursively visits each unique URL (deduped with a `Set`)
5. Page content is extracted via `innerText` for clean, efficient chunking
6. Same embedding + storage pipeline as PDFs

### 💬 Chat

1. User sends a message
2. The query is embedded and used to perform a top-k similarity search in Qdrant
3. The most relevant chunks are injected into the LLM prompt as context
4. Ollama generates a response grounded in the retrieved content
5. The exchange is persisted to PostgreSQL for session continuity

---

## 🤝 Contributing

PRs are welcome! Feel free to open an issue or fork the repo.

---

## 📜 License

MIT

---

_Built with 🧡 by [Pritam](https://github.com/Pritam12F)_
