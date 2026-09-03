# InterviewIQ 2.0 — Security & Hardening Architecture

InterviewIQ employs multi-layer defense-in-depth security across the client, API gateway, LLM orchestration, execution sandbox, and financial ledger.

---

## 1. API Gateway Security

- **Security Headers via Helmet**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrers.
- **Strict CORS Origin Isolation**: Restricts cross-origin requests exclusively to authorized client origins (`CLIENT_URL`).
- **Distributed Rate Limiting**: Enforces request rate limits per client IP via Redis-backed token bucket to protect downstream LLM endpoints from DoS or scraping attacks.
- **Request Body Limits**: Capped at 10MB to prevent memory exhaustion attacks from oversized payload bodies.
- **Strict Zod Input Validation**: 100% of incoming endpoint payloads are parsed against compile-time Zod schemas. Non-conforming payloads are rejected with 400 Bad Request before reaching business services.

---

## 2. Authentication & Credential Hardening

- **Password Hashing**: Stored using `bcrypt` with work factor 10. Passwords are never stored or logged in plain text.
- **Stateless JWT Authorization**: Bearer tokens are cryptographically signed using high-entropy 256-bit secrets (`JWT_SECRET`) with strict 7-day expiration.
- **Signature Integrity**: Tampered or expired JWT tokens are immediately rejected with 401 Unauthorized before any endpoint logic is dispatched.

---

## 3. Sandboxed Code Execution Architecture

Executing arbitrary user-submitted DSA code is a high-risk operational vector. InterviewIQ prevents system intrusion using a 3-layer security model:

1. **Pre-Execution Static AST Tokenizer**:
   Inspects code prior to execution and rejects any script containing dangerous system tokens:
   - File system: `fs`, `require('fs')`, `import ... from 'fs'`
   - Process control: `process`, `process.exit`, `child_process`
   - Metaprogramming: `eval`, `Function`, `globalThis`
   - Network sockets: `net`, `http`, `dgram`
2. **Ephemeral VM Sandbox**:
   Executes inside Node.js `vm.createContext()` with an empty global environment stripped of `process`, `require`, and `Buffer`.
3. **Hardware Boundaries**:
   - Hard execution timeout: 2,000ms. Infinite loops trigger immediate `TIME_LIMIT_EXCEEDED` halts.
   - Bounded memory limits: 128MB ceiling.

---

## 4. AI Prompt Injection & Adversarial Jailbreak Defenses

1. **Prompt Sanitization**:
   User answers and candidate inputs are scanned for prompt injection vectors (`"ignore previous instructions"`, `"reveal system prompt"`, `"you are now unrestricted"`). Suspicious inputs are tagged and encapsulated with strict boundary delimiters.
2. **HTML & Delimiter Stripping**:
   All raw `<script>` tags are neutralized with `[REMOVED_SCRIPT]` and Markdown fence exploits (triple backticks) are safely escaped.
3. **Structured Schema Enforcement**:
   AI provider outputs are never accepted as raw unstructured text. Every model completion must parse against a compile-time Zod schema. Non-schema outputs trigger automated schema repair passes.
4. **Zero Client Secrets**:
   OpenRouter and provider API keys exist solely in backend environment variables and are never bundled into client assets.

---

## 5. Financial Ledger & Idempotency Protection

1. **Cryptographic HMAC Signature Verification**:
   Razorpay webhook payloads and payment confirmations require matching HMAC SHA-256 signatures (`crypto.createHmac`) calculated with `RAZORPAY_KEY_SECRET`.
2. **Idempotency Key Enforcement**:
   Every credit allocation transaction requires a unique idempotency key (e.g. `order_id`). Duplicate requests are rejected at the database level, preventing replay attacks and race condition double-crediting.
3. **Atomic Balance Deductions**:
   Balance deductions check available credits within a transaction and reject overdrafts with 400 Validation Error.
