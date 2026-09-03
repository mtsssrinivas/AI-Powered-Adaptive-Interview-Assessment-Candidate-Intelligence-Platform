import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { UserModel, IUserDocument } from '../../db/mongo/models/User.model';
import { ValidationError, AuthError, NotFoundError } from '../../utils/errors';
import { RegisterInput, LoginInput, User } from '@interviewiq/shared';
import { queryPostgres, inMemoryStore } from '../../config/postgres';

// Memory store fallback for isolated test execution
export const inMemoryUserStore = new Map<string, any>();

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: User; token: string }> {
    const email = input.email.toLowerCase().trim();

    // Check duplicate email in Mongo or fallback
    let existingUser: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        existingUser = await UserModel.findOne({ email });
      } catch {
        existingUser = inMemoryUserStore.get(email);
      }
    } else {
      existingUser = inMemoryUserStore.get(email);
    }

    if (existingUser || inMemoryUserStore.has(email)) {
      throw new ValidationError('An account with this email already exists');
    }

    // Hash password with bcrypt (salt rounds: 12)
    const passwordHash = await bcrypt.hash(input.password, 12);
    const userId = uuidv4();

    const userData = {
      id: userId,
      name: input.name.trim(),
      email,
      passwordHash,
      targetRole: input.targetRole || 'Full Stack Engineer',
      experienceLevel: input.experienceLevel || 'MID',
      preferredInterviewTypes: ['TECHNICAL', 'SYSTEM_DESIGN'],
      creditBalance: 100,
      role: 'CANDIDATE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Mongo if connected, and always cache in memory store
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = new UserModel({
          _id: userId,
          ...userData,
        });
        await doc.save();
      } catch {
        // Fallback store will retain user
      }
    }
    inMemoryUserStore.set(email, userData);
    inMemoryUserStore.set(userId, userData);

    // Record 100 welcome bonus credits in PostgreSQL ledger
    await this.recordSignupCreditLedger(userId);

    const token = this.generateToken(userId, email, userData.role);

    const sanitizedUser: User = {
      id: userId,
      name: userData.name,
      email: userData.email,
      targetRole: userData.targetRole,
      experienceLevel: userData.experienceLevel,
      preferredInterviewTypes: userData.preferredInterviewTypes as any,
      creditBalance: userData.creditBalance,
      role: userData.role,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    return { user: sanitizedUser, token };
  }

  static async login(input: LoginInput): Promise<{ user: User; token: string }> {
    const email = input.email.toLowerCase().trim();

    let userRecord: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await UserModel.findOne({ email });
        if (doc) {
          userRecord = doc.toObject();
          userRecord.id = doc._id.toString();
          userRecord.passwordHash = doc.passwordHash;
        }
      } catch {
        // Mongo fallback
      }
    }

    if (!userRecord) {
      userRecord = inMemoryUserStore.get(email);
    }

    if (!userRecord) {
      throw new AuthError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, userRecord.passwordHash);
    if (!isMatch) {
      throw new AuthError('Invalid email or password');
    }

    const token = this.generateToken(userRecord.id, userRecord.email, userRecord.role);

    const sanitizedUser: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      avatar: userRecord.avatar,
      targetRole: userRecord.targetRole,
      experienceLevel: userRecord.experienceLevel,
      preferredInterviewTypes: userRecord.preferredInterviewTypes,
      creditBalance: userRecord.creditBalance,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    };

    return { user: sanitizedUser, token };
  }

  static async getMe(userId: string): Promise<User> {
    let userRecord: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await UserModel.findById(userId);
        if (doc) {
          userRecord = doc.toObject();
          userRecord.id = doc._id.toString();
        }
      } catch {
        // Mongo fallback
      }
    }

    if (!userRecord) {
      userRecord = inMemoryUserStore.get(userId);
    }

    if (!userRecord) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      avatar: userRecord.avatar,
      targetRole: userRecord.targetRole,
      experienceLevel: userRecord.experienceLevel,
      preferredInterviewTypes: userRecord.preferredInterviewTypes,
      creditBalance: userRecord.creditBalance,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    };
  }

  private static generateToken(id: string, email: string, role: string): string {
    return jwt.sign({ id, email, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private static async recordSignupCreditLedger(userId: string): Promise<void> {
    const txId = uuidv4();
    try {
      await queryPostgres(
        `INSERT INTO credit_ledger (id, user_id, amount, balance_after, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [txId, userId, 100, 100, 'SIGNUP_BONUS', 'Welcome grant of 100 evaluation credits']
      );
    } catch {
      // Fallback in memory ledger table
      const ledger = inMemoryStore.getTable('credit_ledger');
      ledger.set(txId, {
        id: txId,
        userId,
        amount: 100,
        balanceAfter: 100,
        type: 'SIGNUP_BONUS',
        description: 'Welcome grant of 100 evaluation credits',
        createdAt: new Date(),
      });
    }
  }
}
