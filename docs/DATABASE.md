# InterviewIQ 2.0 — Database Architecture & Schemas

InterviewIQ uses a dual-database architecture combining MongoDB and PostgreSQL to leverage document flexibility alongside ACID relational integrity.

---

## 1. PostgreSQL (Relational Integrity & Ledger)

PostgreSQL manages financial transactions, credit ledgers, and telemetry metrics where relational integrity and ACID guarantees are non-negotiable.

### `credit_transactions` Table
Stores immutable ledger entries for every credit deposit, deduction, and bonus.
```sql
CREATE TABLE credit_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    amount INT NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'PURCHASE', 'USAGE', 'REFUND', 'BONUS'
    reason VARCHAR(255) NOT NULL,
    reference_id VARCHAR(128),
    idempotency_key VARCHAR(128) UNIQUE, -- Guard against duplicate transactions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_idempotency ON credit_transactions(idempotency_key);
```

### `user_balances` Table
Maintains user balance cache for low-latency lookups, guaranteed consistent with `credit_transactions`.
```sql
CREATE TABLE user_balances (
    user_id VARCHAR(64) PRIMARY KEY,
    current_balance INT NOT NULL DEFAULT 100,
    lifetime_earned INT NOT NULL DEFAULT 100,
    lifetime_spent INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `ai_requests` Table
Records comprehensive telemetry for every AI LLM invocation.
```sql
CREATE TABLE ai_requests (
    id VARCHAR(64) PRIMARY KEY,
    capability VARCHAR(64) NOT NULL,
    model VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    tokens_used INT NOT NULL,
    latency_ms INT NOT NULL,
    success BOOLEAN NOT NULL,
    user_id VARCHAR(64),
    prompt_version VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. MongoDB (Document Domain Models)

MongoDB stores flexible, hierarchical candidate documents, multi-page resume artifacts, and dynamic interview state trees.

### `InterviewSession` Collection
- `userId`: Foreign key to candidate account
- `role`, `interviewMode`, `experienceLevel`: Configuration criteria
- `plan`: Adaptive interview blueprint generated during initialization
- `currentState`: State machine state (`INITIALIZED`, `CONFIGURED`, `PLANNED`, `QUESTION_ACTIVE`, `EVALUATING`, `ADAPTING`, `FINALIZED`)
- `questions`: Array of questions generated with category, target skill, and calibrated difficulty
- `evaluations`: Array of 6-dimensional rubric evaluations

### `Resume` Collection
- `userId`: Owning candidate ID
- `fileName`, `fileSize`, `mimeType`: Upload metadata
- `rawText`: Complete extracted plain text
- `parsedProfile`: Structured data:
  - `candidateName`, `email`, `yearsOfExperience`
  - `skills`: Array of claimed skills with confidence score and evidence quotes
  - `projects`: Extracted portfolio projects with technologies and claimed outcomes
  - `experience`: Chronological work history
  - `education`: Degrees and institutions

### `CandidateSkill` Collection
- `userId`: Candidate ID
- `skill`: Canonical skill identifier (e.g. `Kafka`, `PostgreSQL`, `Docker`)
- `category`: Competency category (`Backend`, `Databases`, `DevOps`, `CS Fundamentals`)
- `proficiencyLevel`: Current progression state (`EXPOSURE_ONLY`, `DEVELOPING`, `PROFICIENT`, `EXPERT`)
- `verifiedAt`: Timestamp when competency was empirically verified in an interview
- `evidence`: Quoted evidence snippet from resume or live interview answer

---

## 3. Redis (Cache & Distributed Queues)

- **Rate Limiting**: Distributed token-bucket key tracking client request rates by IP address.
- **BullMQ**: Reliable message broker managing background queue workers for LLM generation, PDF processing, and asynchronous report compiling.
