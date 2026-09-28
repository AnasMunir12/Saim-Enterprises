import mongoose, { Schema } from "mongoose";

export interface ICollection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  active: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const Collection = mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema);
