# InterviewIQ 2.0 — API Reference Specification

All endpoints are versioned under `/api/v1` and attach correlation tracking headers (`x-request-id`).

---

## 1. System Health & Observability

### `GET /api/v1/health`
Returns real-time health diagnostic status of all connected subsystems.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-03T23:40:00.000Z",
  "version": "2.0.0",
  "subsystems": {
    "mongodb": { "status": "up" },
    "postgres": { "status": "up" },
    "redis": { "status": "up" },
    "aiProvider": { "status": "up", "provider": "mock" }
  },
  "uptimeSeconds": 182
}
```

### `GET /api/v1/ready`
Readiness probe for Kubernetes / Docker container orchestrators.

### `GET /api/v1/metrics`
Runtime Prometheus and JSON metrics endpoint.
- **Default**: Returns JSON metrics with memory usage (RSS, heapUsed, heapTotal) and HTTP request latency percentiles (P50, P95, P99).
- **Header `Accept: text/plain`**: Returns Prometheus text exposition format.

---

## 2. Authentication & User Management (`/api/v1/auth`, `/api/v1/users`)

### `POST /api/v1/auth/register`
Creates a candidate account and seeds an initial 100-credit welcome balance.
- **Body**: `{ "name": "...", "email": "...", "password": "...", "targetRole": "..." }`
- **Response `201 Created`**: `{ "token": "...", "user": { ... } }`

### `POST /api/v1/auth/login`
Authenticates with email and password, returning a signed Bearer JWT (7-day validity).
- **Body**: `{ "email": "...", "password": "..." }`
- **Response `200 OK`**: `{ "token": "...", "user": { ... } }`

### `GET /api/v1/auth/me`
Returns current authenticated user profile. Requires `Authorization: Bearer <token>`.

### `GET /api/v1/users/intelligence-profile`
Aggregates multi-session candidate performance: verified skills, claimed skills, competency radar, and hiring verdict.

### `GET /api/v1/users/readiness`
Returns hiring readiness score and verdict (`STRONG_HIRE`, `HIRE`, `LEAN_HIRE`, `LEAN_NO_HIRE`, `NO_HIRE`).

---

## 3. Resume Processing & Intelligence (`/api/v1/resumes`)

### `POST /api/v1/resumes/upload`
Multipart form upload of candidate PDF resume.
- Extracts experience, technologies, and project outcomes.
- Automatically seeds the candidate skill graph in the `EXPOSURE_ONLY` state.
- **Response `201 Created`**: `{ "success": true, "resume": { ... } }`

### `GET /api/v1/resumes/projects`
Returns parsed candidate projects with technologies and evidence snippets.

---

## 4. Adaptive Interviews (`/api/v1/interviews`)

### `POST /api/v1/interviews`
Initializes a new interview session.
- **Body**: `{ "role": "Senior Backend Engineer", "interviewMode": "BACKEND", "experienceLevel": "SENIOR", "durationMinutes": 45, "questionCount": 5 }`
- **Response `201 Created`**: Session initialized with state `PLANNED`.

### `POST /api/v1/interviews/:id/next-question`
Retrieves the next adaptive question, incorporating RAG architectural ground-truth reference knowledge.
- **Response `201 Created`**: Returns hydrated `Question` schema.

### `POST /api/v1/interviews/:id/answer`
Submits candidate answer for 6-dimensional rubric evaluation.
- **Body**: `{ "questionId": "...", "candidateAnswer": "..." }`
- **Response `200 OK`**: `{ "evaluation": { "scores": { "overallScore": 82, ... }, "strengths": [...], "weaknesses": [...], "missingConcepts": [...] } }`

---

## 5. DSA Coding Sandbox (`/api/v1/coding`)

### `GET /api/v1/coding/problems`
Returns curated DSA challenges with problem descriptions, tags, and starter code.

### `POST /api/v1/coding/run`
Executes code against public test cases inside an isolated VM sandbox with a 2000ms CPU timeout.

### `POST /api/v1/coding/submit`
Executes code against hidden test cases and generates an AI complexity evaluation report.

---

## 6. Financial Ledger & Credits (`/api/v1/payments`, `/api/v1/credits`)

### `POST /api/v1/payments/create-order`
Initializes a Razorpay payment order for selected credit tier.

### `POST /api/v1/payments/verify`
Verifies Razorpay HMAC SHA-256 signature and credits the user account with strict idempotency key protection.

### `GET /api/v1/credits/balance`
Returns current available credits and lifetime earned/spent totals.

### `POST /api/v1/credits/deduct`
Atomically deducts credits for platform actions (e.g. starting an interview session). Rejects overdraws.
