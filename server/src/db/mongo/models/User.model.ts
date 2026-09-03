import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  targetRole: string;
  experienceLevel: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF' | 'LEAD';
  preferredInterviewTypes: string[];
  creditBalance: number;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    targetRole: { type: String, default: 'Backend Engineer' },
    experienceLevel: {
      type: String,
      enum: ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'STAFF', 'LEAD'],
      default: 'MID',
    },
    preferredInterviewTypes: {
      type: [String],
      default: ['TECHNICAL', 'SYSTEM_DESIGN'],
    },
    creditBalance: { type: Number, default: 100, min: 0 },
    role: { type: String, enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'], default: 'CANDIDATE' },
  },
  {
    timestamps: true,
    bufferCommands: false,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
