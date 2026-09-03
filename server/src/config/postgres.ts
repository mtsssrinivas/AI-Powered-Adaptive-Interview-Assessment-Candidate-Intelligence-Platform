import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';
import { logger } from './logger';

export type PostgresStatus = 'connected' | 'disconnected' | 'in_memory_fallback';

let pool: Pool | null = null;
let pgStatus: PostgresStatus = 'disconnected';
let lastPgError: string | null = null;

// In-memory relational store fallback if local Postgres service is not running
class InMemoryRelationalStore {
  private tables: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.tables.set('credit_ledger', new Map());
    this.tables.set('payments', new Map());
    this.tables.set('competency_scores', new Map());
    this.tables.set('coding_submissions', new Map());
    this.tables.set('ai_requests', new Map());
  }

  getTable(name: string): Map<string, any> {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map());
    }
    return this.tables.get(name)!;
  }
}

export const inMemoryStore = new InMemoryRelationalStore();

export const initPostgres = async (): Promise<void> => {
  try {
    const isCloudDb =
      env.POSTGRES_URL.includes('render.com') ||
      env.POSTGRES_URL.includes('supabase') ||
      env.POSTGRES_URL.includes('neon') ||
      env.POSTGRES_URL.includes('amazonaws.com') ||
      env.POSTGRES_URL.includes('sslmode=require') ||
      (env.NODE_ENV === 'production' && !env.POSTGRES_URL.includes('localhost') && !env.POSTGRES_URL.includes('127.0.0.1'));

    pool = new Pool({
      connectionString: env.POSTGRES_URL,
      connectionTimeoutMillis: 5000,
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    pgStatus = 'connected';
    lastPgError = null;
    logger.info('PostgreSQL connected successfully');

    // Run core schema initialization
    await createTablesIfNotExist();
  } catch (error: any) {
    pgStatus = 'in_memory_fallback';
    lastPgError = error?.message || 'Postgres unreachable';
    logger.warn('PostgreSQL connection failed. Operating in in-memory fallback mode for local testing.', {
      error: lastPgError,
    });
  }
};

const createTablesIfNotExist = async (): Promise<void> => {
  if (!pool || pgStatus !== 'connected') return;

  const ddl = `
    CREATE TABLE IF NOT EXISTS credit_ledger (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      balance_after NUMERIC(10, 2) NOT NULL,
      type VARCHAR(32) NOT NULL,
      description TEXT NOT NULL,
      reference_id VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      order_id VARCHAR(64) UNIQUE NOT NULL,
      payment_id VARCHAR(64) UNIQUE,
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      status VARCHAR(32) NOT NULL,
      idempotency_key VARCHAR(64) UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competency_scores (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      interview_id VARCHAR(64) NOT NULL,
      competency VARCHAR(64) NOT NULL,
      score NUMERIC(5, 2) NOT NULL,
      evidence TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coding_submissions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      problem_id VARCHAR(64) NOT NULL,
      language VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      pass_rate NUMERIC(5, 2) NOT NULL,
      passed_count INT NOT NULL,
      total_count INT NOT NULL,
      runtime_ms INT NOT NULL,
      memory_kb INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_requests (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      capability VARCHAR(64) NOT NULL,
      provider VARCHAR(32) NOT NULL,
      model VARCHAR(64) NOT NULL,
      prompt_version VARCHAR(32) NOT NULL,
      tokens_used INT DEFAULT 0,
      latency_ms INT NOT NULL,
      success BOOLEAN NOT NULL,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_competency_user ON competency_scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id);
  `;

  try {
    await pool.query(ddl);
    logger.info('PostgreSQL schemas verified and indexed successfully');
  } catch (err: any) {
    logger.error('Failed to run PostgreSQL DDL migrations', { error: err?.message });
  }
};

export const queryPostgres = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  if (pool && pgStatus === 'connected') {
    return pool.query<T>(text, params);
  }
  // Return empty result set structure for fallback
  return {
    rows: [] as T[],
    command: '',
    rowCount: 0,
    oid: 0,
    fields: [],
  };
};

export const getPostgresStatus = (): { status: PostgresStatus; error: string | null } => {
  return { status: pgStatus, error: lastPgError };
};
