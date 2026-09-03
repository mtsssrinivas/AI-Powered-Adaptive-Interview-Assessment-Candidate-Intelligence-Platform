# InterviewIQ 2.0

> **AI-Powered Adaptive Interview Assessment & Candidate Intelligence Platform**

InterviewIQ 2.0 is an enterprise-grade technical interview assessment engine built on a distributed full-stack architecture. Unlike naive LLM prompt wrappers or static questionnaires, InterviewIQ evaluates technical candidates through an empirical, evidence-driven, continuous feedback loop.

---

## System Architecture

```
[Candidate Browser (React 18 + Vite)]
          │ (HTTPS REST / Bearer JWT)
          ▼
[Express API Gateway (Port 5000)] ◄───► [Redis (Rate Limit / Session Cache)]
          │
          ├──► [MongoDB (Mongoose)]: User Profiles, Resumes, Transcripts, Project Details
          ├──► [PostgreSQL (pg/Pool)]: Credit Ledger, Competency Scores, Submission Logs
          │
          ▼ (Job Dispatch)
[BullMQ Distributed Queues]
          │
          ▼
[Worker Daemon Process]
          ├──► [AI Orchestrator Core] ──► [OpenRouter LLM] (Schema-Validated Zod)
          └──► [Isolated Code Runner] ──► [Ephemeral Sandboxes] (Multi-Language)
```

---

## Infrastructure Rationale

- **MongoDB**: Used for flexible, hierarchical document storage including candidate profiles, parsed multi-page PDF resumes, detailed project artifacts, and conversational transcripts.
- **PostgreSQL**: Used for relational integrity, immutable financial transactions (credit ledger, Razorpay orders), and multi-dimensional analytical queries across competency benchmarks.
- **Redis**: Provides distributed rate limiting, ephemeral session caching, and the atomic messaging layer powering BullMQ.
- **BullMQ & Background Workers**: Decouples heavy asynchronous workloads (LLM generation, PDF parsing, DSA compilation) from the synchronous Express HTTP thread pool.
- **Docker Compose**: Orchestrates all six containers (`frontend`, `backend`, `worker`, `mongodb`, `postgres`, `redis`) with clean networking and persistent volumes.

---

## Local Development Quickstart

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose (optional for full containerized cluster)

### Setup & Run
```bash
# 1. Install dependencies across all monorepo workspaces
npm install

# 2. Build shared type contracts
npm run build --workspace=shared

# 3. Start development servers concurrently (Backend on 5000, Frontend on 5173)
npm run dev
```

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

---

## Directory Structure

```
interviewiq/
├── client/         # React + TypeScript + Vite + Tailwind CSS
├── server/         # Node.js + TypeScript + Express + Mongoose + PG + BullMQ
├── shared/         # Shared Zod schemas, TypeScript types, and enums
├── docs/           # Architecture, API specifications, and database rationale
├── scripts/        # Database seeders and maintenance scripts
├── tests/          # End-to-end and integration test suites
├── docker/         # Production Dockerfiles and Nginx configurations
├── .github/        # GitHub Actions CI pipeline
├── docker-compose.yml
└── README.md
```
