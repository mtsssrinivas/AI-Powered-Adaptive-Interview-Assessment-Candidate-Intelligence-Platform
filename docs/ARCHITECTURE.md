# InterviewIQ 2.0 — System Architecture & Infrastructure Rationale

## 1. Architectural Philosophy

InterviewIQ 2.0 is an enterprise-grade AI-powered adaptive interview assessment and candidate intelligence platform. It treats technical evaluation as an empirical, evidence-driven, continuous feedback loop rather than a superficial prompt wrapper or static questionnaire.

---

## 2. Infrastructure Rationale: Why Each Technology Was Selected

Every component in the InterviewIQ architecture fulfills a distinct, non-redundant operational mandate:

### WHY MongoDB?
- **Document-Oriented Domain Objects**: Resumes, candidate project artifacts, and interview transcripts are inherently hierarchical and evolve over time.
- **Flexible Schema Evolution**: Parsed resumes contain variable depth (projects, certifications, nested responsibilities, and evidence excerpts). MongoDB documents allow lossless storage of variable candidate portfolios without sparse relational schema bloat.
- **Transcript Archiving**: Dynamic interview conversation turns, candidate answers, and prompt context snapshots map naturally to embedded documents.

### WHY PostgreSQL?
- **Strict Relational Integrity & ACID Guarantees**: Payments, credit ledger balances, and user account status require strict consistency. No lost credits or phantom balances are tolerable.
- **Quantitative Analytics & Aggregations**: PostgreSQL excels at aggregate analytical queries (window functions, time-series trends, competency score distributions, and percentile calculations).
- **Relational Competency Model**: Mapping skills to competencies, evaluations to benchmark rubrics, and computing longitudinal readiness scores requires indexed foreign keys and strict relational integrity.

### WHY Redis?
- **Sub-Millisecond Transient State**: Fast lookup of active interview sessions, rate limiting counters, and short-lived evaluation locks.
- **Backbone for Distributed Queues**: Powering BullMQ with atomic Lua scripts, reliable pub/sub, delayed jobs, and rate-limited worker dispatch.
- **API Rate Limiting & Protection**: Distributed token-bucket rate limiting to prevent API abuse and protect expensive downstream LLM calls.

### WHY BullMQ & Background Workers?
- **Decoupling Latency from Express Request Lifecycle**:
  - LLM completion queries can take 2,000ms – 10,000ms.
  - Multi-page PDF parsing and OCR can take multiple seconds.
  - DSA code execution requires compilation, sandboxed process spawning, and multi-test execution.
- **Fault Tolerance & Idempotency**: BullMQ provides automatic retries with exponential backoff, dead-letter failure queues, job deduplication by ID, and execution telemetry without blocking HTTP worker threads.

### WHY Docker & Container Isolation?
- **Reproducible Runtime Environment**: Standardizes multi-language compiler toolchains (Node.js, Python 3, OpenJDK, GCC/G++) across staging and production.
- **Isolated Process Sandboxing**: Candidate-submitted code must never run in the host process. Containers provide compute and memory boundaries, ephemeral filesystems, and strict network isolation.
- **Unified Orchestration**: A single command (`docker-compose up`) boots the complete distributed platform including databases, caching layers, API gateways, workers, and web clients.

---

## 3. High-Level Data Flow

```
[Candidate Browser]
        │
        ▼ (HTTPS REST / Bearer JWT)
[Express API Gateway (Port 5000)] ◄───► [Redis (Rate Limit / Session Cache)]
        │
        ├──► [MongoDB]: User Profiles, Resumes, Transcripts, Project Details
        ├──► [PostgreSQL]: Credit Ledger, Competency Scores, Submission Logs
        │
        ▼ (Job Dispatch)
[BullMQ Distributed Queues]
        │
        ▼
[Worker Daemon Process]
        ├──► [AI Orchestrator] ──► [OpenRouter LLM] (Schema Validated Zod)
        └──► [Isolated Code Runner] ──► [Ephemeral Sandboxes] (Multi-Language)
```
