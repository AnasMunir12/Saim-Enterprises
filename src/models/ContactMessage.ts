import mongoose, { Schema } from "mongoose";

import { MESSAGE_STATUSES, type MessageStatus } from "@/lib/contact-message";

export interface IContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: MessageStatus;
  // HMAC of the sender's IP address: lets the owner spot repeat abuse without storing the address itself.
  ipHash?: string;
  // Set when the sender was signed in.
  userId?: string;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: [...MESSAGE_STATUSES], default: "new", index: true },
    ipHash: { type: String, maxlength: 64 },
    userId: { type: String },
    adminNote: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage = mongoose.models.ContactMessage || mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
