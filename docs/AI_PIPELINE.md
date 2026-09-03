# InterviewIQ 2.0 — AI Pipeline & Orchestration Architecture

The AI layer in InterviewIQ 2.0 operates as a resilient, schema-enforced multi-provider orchestration system rather than a naive prompt wrapper.

---

## 1. Multi-Provider Abstraction

The `AIOrchestrator` manages model execution through an abstract provider interface (`IAIProvider`):
- **Primary Provider**: `OpenRouterProvider` with configurable default model (`anthropic/claude-3.5-sonnet`, `openai/gpt-4o`, `google/gemini-pro`).
- **Fallback Provider**: `MockAIProvider` for local offline development, continuous integration test suites, and operational resilience when external network connectivity is degraded.

```
AI Request ──► [Prompt Sanitizer] ──► [Primary Provider: OpenRouter]
                                              │ (On Rate Limit / 5xx)
                                              ▼ (Exponential Backoff x3)
                                      [Secondary Provider / Mock]
                                              │
                                              ▼
                                     [Zod Schema Validation]
                                              │ (If Malformed)
                                              ▼
                                     [Automated Schema Repair]
                                              │
                                              ▼
                                     [PostgreSQL Telemetry Log]
```

---

## 2. Specialized Capabilities

The orchestration pipeline routes tasks to specialized prompts with versioned schemas:

| Capability | Role & Purpose | Schema Contract |
|:---|:---|:---|
| `RESUME_PARSER` | Ingests raw text from PDF and extracts structured candidate portfolio | `CandidateProfileSchema` |
| `INTERVIEW_PLANNER` | Builds customized multi-stage interview assessment blueprint | `InterviewPlanSchema` |
| `QUESTION_GENERATOR` | Synthesizes targeted technical questions grounded in RAG architecture rules | `QuestionSchema` |
| `ANSWER_EVALUATOR` | Evaluates candidate answer across 6 rubric dimensions | `AnswerEvaluationSchema` |
| `COMPLEXITY_ANALYZER`| Analyzes DSA algorithm asymptotic Big-O runtime and memory | `ComplexityEvaluationSchema` |
| `PREPARATION_PLANNER`| Builds priority-ordered study roadmaps from empirical missing concepts | `PreparationPlanSchema` |

---

## 3. RAG Architectural Ground-Truth Retrieval

To guarantee technical accuracy and prevent hallucinations in system design and backend evaluations, InterviewIQ incorporates a Retrieval-Augmented Generation (RAG) pipeline:

1. **Corpus Indexing**: Reference architectural knowledge covering Distributed Caching, PostgreSQL MVCC, Kafka Partitioning, Sliding Window DSA, and Cloud Resilience.
2. **Multi-Factor Retrieval**: Matches query terms against canonical skills, categories, tags, and topic keywords.
3. **Re-Ranking & Injection**: Ranks top chunks by relevance score and injects verified architectural constraints directly into the prompt before dispatching to the LLM.

---

## 4. Telemetry & Observability

Every AI invocation tracks:
- Total execution latency in milliseconds (`latencyMs`)
- Estimated token consumption (`tokensUsed`)
- Model and provider identifier
- User ID and prompt version tag
- Real-time logging to the PostgreSQL `ai_requests` table and Prometheus counters.
