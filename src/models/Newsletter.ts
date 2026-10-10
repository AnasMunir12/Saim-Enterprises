import mongoose, { Schema } from "mongoose";

export interface INewsletterSubscriber {
  _id: string;
  email: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletterSubscriber>(
  {
    _id: { type: String },
    // Stored lower-cased; the unique index is what dedupes concurrent signups.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    source: { type: String, default: "website", trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

export const Newsletter = mongoose.models.Newsletter || mongoose.model<INewsletterSubscriber>("Newsletter", NewsletterSchema);
