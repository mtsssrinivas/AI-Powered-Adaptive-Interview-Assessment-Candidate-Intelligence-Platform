import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import {
  CreditBalance,
  CreditTransaction,
  CreditTransactionType,
} from '@interviewiq/shared';
import { queryPostgres, inMemoryStore } from '../../config/postgres';
import { UserModel } from '../../db/mongo/models/User.model';
import { inMemoryUserStore } from '../auth/auth.service';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../config/logger';

export class CreditsService {
  static async getBalance(userId: string): Promise<CreditBalance> {
    let balance = 100;
    let totalEarned = 100;
    let totalSpent = 0;
    let lastUpdated: Date = new Date();

    try {
      const res = await queryPostgres(
        `SELECT id, amount, balance_after, transaction_type, reason, reference_id, created_at 
         FROM credit_ledger 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      if (res.rows.length > 0) {
        balance = res.rows[0].balance_after;
        lastUpdated = res.rows[0].created_at;
        totalEarned = res.rows
          .filter((r) => r.amount > 0)
          .reduce((sum, r) => sum + r.amount, 0);
        totalSpent = Math.abs(
          res.rows.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0)
        );
      }
    } catch {
      // In-memory fallback
    }

    if (totalSpent === 0 && totalEarned === 100) {
      const table = inMemoryStore.getTable('credit_ledger');
      const userRows = Array.from(table.values())
        .filter((r) => r.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (userRows.length > 0) {
        balance = userRows[0].balanceAfter;
        lastUpdated = new Date(userRows[0].createdAt);
        totalEarned = userRows
          .filter((r) => r.amount > 0)
          .reduce((sum, r) => sum + r.amount, 0);
        totalSpent = Math.abs(
          userRows.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0)
        );
      } else {
        const user = inMemoryUserStore.get(userId);
        balance = user?.creditBalance ?? 100;
      }
    }

    return {
      userId,
      currentBalance: balance,
      totalEarned,
      totalSpent,
      lastUpdated,
    };
  }

  static async addCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    idempotencyKey?: string,
    type: CreditTransactionType = 'PURCHASE'
  ): Promise<CreditBalance> {
    if (amount <= 0) {
      throw new ValidationError('Credit amount must be strictly positive');
    }

    // Idempotency check: prevent duplicate crediting
    if (idempotencyKey) {
      const table = inMemoryStore.getTable('credit_ledger');
      const existing = Array.from(table.values()).find(
        (t) => t.referenceId === idempotencyKey
      );
      if (existing) {
        logger.info('Duplicate credit operation prevented via idempotencyKey', { idempotencyKey });
        return this.getBalance(userId);
      }
    }

    const current = await this.getBalance(userId);
    const newBalance = current.currentBalance + amount;
    const txId = uuidv4();

    const tx: CreditTransaction = {
      id: txId,
      userId,
      amount,
      balanceAfter: newBalance,
      type,
      description,
      referenceId: idempotencyKey || referenceId,
      createdAt: new Date(),
    };

    // 1. Record in PostgreSQL ledger
    try {
      await queryPostgres(
        `INSERT INTO credit_ledger (id, user_id, amount, balance_after, transaction_type, reason, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txId, userId, amount, newBalance, type, description, idempotencyKey || referenceId || null]
      );
    } catch {
      // Handled in inMemoryStore
    }

    // 2. Record in in-memory store
    inMemoryStore.getTable('credit_ledger').set(txId, tx);

    // 3. Update User model balance
    const cachedUser = inMemoryUserStore.get(userId);
    if (cachedUser) {
      cachedUser.creditBalance = newBalance;
    }

    if (mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndUpdate(userId, { creditBalance: newBalance }).catch(() => {});
    }

    return this.getBalance(userId);
  }

  static async deductCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    type: CreditTransactionType = 'INTERVIEW_DEDUCTION'
  ): Promise<CreditBalance> {
    if (amount <= 0) {
      throw new ValidationError('Deduct amount must be strictly positive');
    }

    const current = await this.getBalance(userId);
    if (current.currentBalance < amount) {
      throw new ValidationError(
        `Insufficient credits: Balance is ${current.currentBalance}, but ${amount} credits required.`
      );
    }

    const newBalance = current.currentBalance - amount;
    const txId = uuidv4();

    const tx: CreditTransaction = {
      id: txId,
      userId,
      amount: -amount,
      balanceAfter: newBalance,
      type,
      description,
      referenceId,
      createdAt: new Date(),
    };

    try {
      await queryPostgres(
        `INSERT INTO credit_ledger (id, user_id, amount, balance_after, transaction_type, reason, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txId, userId, -amount, newBalance, type, description, referenceId || null]
      );
    } catch {
      // fallback
    }

    inMemoryStore.getTable('credit_ledger').set(txId, tx);

    const cachedUser = inMemoryUserStore.get(userId);
    if (cachedUser) {
      cachedUser.creditBalance = newBalance;
    }

    if (mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndUpdate(userId, { creditBalance: newBalance }).catch(() => {});
    }

    return this.getBalance(userId);
  }
}
