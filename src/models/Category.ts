import mongoose, { Schema } from "mongoose";

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
