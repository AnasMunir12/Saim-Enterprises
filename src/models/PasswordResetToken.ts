import mongoose, { type Document, Schema, type Types } from "mongoose";

// Only the SHA-256 hash of the emailed token is stored, never the token itself.
export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// MongoDB removes expired documents automatically (TTL monitor runs about once a minute).
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
