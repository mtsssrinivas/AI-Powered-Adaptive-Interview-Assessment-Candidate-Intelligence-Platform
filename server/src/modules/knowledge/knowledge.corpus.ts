export interface KnowledgeChunk {
  id: string;
  category: string;
  topic: string;
  skill: string;
  tags: string[];
  content: string;
  verifiedArchitectureRules: string[];
}

export const TECHNICAL_KNOWLEDGE_CORPUS: KnowledgeChunk[] = [
  {
    id: 'rag-sys-caching-01',
    category: 'System Design',
    topic: 'Distributed Caching and Cache Stampede Mitigation',
    skill: 'Redis',
    tags: ['caching', 'redis', 'stampede', 'concurrency', 'mutex'],
    content: `When scaling read-heavy services with Redis, cache stampede (thundering herd) occurs when a popular cache key expires and thousands of concurrent requests simultaneously query the downstream database. Mitigation strategies include:
1. Distributed Locking (Mutex): The first worker acquires a short-lived Redis distributed lock (SET NX PX) to regenerate the cache value, while other requests either wait or read stale data.
2. Probabilistic Early Expiration (XFetch algorithm): Recomputes the cache item asynchronously before expiration based on delta computation time and remaining TTL.
3. Write-Behind (Write-Back) Caching: Asynchronously flushes updates from cache to database via write buffers.`,
    verifiedArchitectureRules: [
      'Must specify mutex locking (SET NX PX) or probabilistic early expiration for hot key stampede prevention.',
      'Must explain cache invalidation vs TTL trade-offs.',
      'Must differentiate between write-through and write-behind failure modes.',
    ],
  },
  {
    id: 'rag-db-concurrency-02',
    category: 'Databases',
    topic: 'PostgreSQL MVCC, Isolation Levels, and Deadlock Resolution',
    skill: 'PostgreSQL',
    tags: ['postgresql', 'mvcc', 'acid', 'isolation', 'deadlock', 'wal'],
    content: `PostgreSQL implements Multi-Version Concurrency Control (MVCC) where updates and deletes create new tuple versions rather than overwriting in place. 
- Read Committed: Reads see data committed before the individual query began.
- Repeatable Read: Reads see data committed before the current transaction began; prevents non-repeatable reads and phantom reads.
- Serializable: True serializability via SSI (Serializable Snapshot Isolation) tracking read-write conflicts.
Deadlocks occur when two concurrent transactions acquire shared/exclusive row locks in reverse order. Resolution requires deterministic lock acquisition ordering and deadlock_timeout aborts.`,
    verifiedArchitectureRules: [
      'Candidate must recognize that MVCC does not lock readers for writers and vice-versa.',
      'Must address deterministic ordering (e.g. ORDER BY id FOR UPDATE) to prevent deadlock loops.',
      'Must mention VACUUM and table bloat trade-offs inherent in MVCC tuple versioning.',
    ],
  },
  {
    id: 'rag-messaging-kafka-03',
    category: 'Backend',
    topic: 'Kafka Partitioning, Consumer Groups, and Exactly-Once Semantics',
    skill: 'Kafka',
    tags: ['kafka', 'streaming', 'partitions', 'consumer-groups', 'exactly-once', 'idempotence'],
    content: `Apache Kafka achieves horizontal scalability through topic partitioning, where each partition is an append-only commit log ordered by sequence offset.
- Consumer Groups: Consumers in a group divide partitions evenly. Rebalancing protocols (eager vs cooperative sticky) reassign partitions upon worker joining/failure.
- Cooperative Sticky Assignor: Minimizes consumer stop-the-world downtime by revoking only reassigned partitions instead of all partitions.
- Exactly-Once Semantics (EOS): Combines idempotent producer (sequence numbers assigned by broker to eliminate retried duplicates) with two-phase commit transactional API across partition boundaries.`,
    verifiedArchitectureRules: [
      'Candidate must identify partition count as the fundamental unit of consumer parallelism.',
      'Must explain cooperative sticky assignors vs stop-the-world eager rebalances.',
      'Must explain idempotent producers with PID and sequence numbering.',
    ],
  },
  {
    id: 'rag-dsa-two-pointers-04',
    category: 'CS Fundamentals',
    topic: 'Two Pointers & Sliding Window Invariant Optimization',
    skill: 'Data Structures & Algorithms',
    tags: ['dsa', 'two-pointers', 'sliding-window', 'time-complexity'],
    content: `Two-pointer and sliding window techniques optimize nested O(N^2) searches into linear O(N) single-pass scans by preserving structural invariants.
- Two Pointers: Left and right pointers converge (e.g., sorted two sum) or fast/slow pointers traverse linked structures (Floyd cycle detection).
- Sliding Window: Dynamically expands right bound to include elements until invariant is broken, then shrinks left bound while maintaining monotonic lookups (e.g., hash map or frequency array).`,
    verifiedArchitectureRules: [
      'Must demonstrate O(N) time complexity and bounded memory O(1) or O(K).',
      'Must handle empty, single-element, and duplicate edge conditions.',
    ],
  },
  {
    id: 'rag-cloud-resilience-05',
    category: 'System Design',
    topic: 'Circuit Breakers, Bulkheads, and Distributed Rate Limiting',
    skill: 'Distributed Systems',
    tags: ['circuit-breaker', 'bulkhead', 'rate-limiting', 'token-bucket', 'resilience'],
    content: `Resilient microservice architectures prevent cascading failures across service boundaries using:
1. Circuit Breaker Pattern: Monitors downstream call failure rate across a rolling time window. Transitions between CLOSED, OPEN, and HALF-OPEN states to fail fast without overloading degraded dependencies.
2. Bulkhead Isolation: Isolates thread pools and connection resources per downstream dependency so one failing service cannot exhaust host threads.
3. Distributed Rate Limiting: Token Bucket or Leaky Bucket implemented over Redis cluster via atomic Lua scripts to enforce client request quotas.`,
    verifiedArchitectureRules: [
      'Must specify state transitions: CLOSED -> OPEN -> HALF-OPEN.',
      'Must articulate bulkhead resource isolation to prevent thread pool exhaustion.',
      'Must cite atomic Lua script execution in Redis for distributed token bucket synchronization.',
    ],
  },
];
