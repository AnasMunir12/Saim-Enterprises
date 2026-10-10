import mongoose, { Schema } from "mongoose";

export interface IWishlist {
  userId: string;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    productIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Wishlist = mongoose.models.Wishlist || mongoose.model<IWishlist>("Wishlist", WishlistSchema);
