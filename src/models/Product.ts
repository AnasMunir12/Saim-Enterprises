import mongoose, { Schema } from "mongoose";

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  collectionId?: string;
  sku: string;
  stock: number;
  availability: string;
  status: "draft" | "active" | "inactive";
  featured: boolean;
  image: string;
  images: string[];
  thumbnail?: string;
  tags: string[];
  material?: string;
  dimensions?: string;
  color?: string;
  customizable: boolean;
  seoTitle?: string;
  seoDescription?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  shortDescription: { type: String, default: "", trim: true },
  description: { type: String, default: "", trim: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  categoryId: { type: String, required: true, index: true },
  collectionId: { type: String, index: true },
  sku: { type: String, default: "", trim: true },
  stock: { type: Number, default: 0, min: 0 },
  availability: { type: String, default: "In stock" },
  status: { type: String, enum: ["draft", "active", "inactive"], default: "draft" },
  featured: { type: Boolean, default: false, index: true },
  image: { type: String, default: "" },
  images: { type: [String], default: [] },
  thumbnail: { type: String, default: "" },
  tags: { type: [String], default: [] },
  material: { type: String, default: "" },
  dimensions: { type: String, default: "" },
  color: { type: String, default: "" },
  customizable: { type: Boolean, default: false },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
