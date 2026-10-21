import mongoose, { Schema } from "mongoose";

export interface ICloudinaryAsset {
  _id: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

const CloudinaryAssetSchema = new Schema<ICloudinaryAsset>({
  _id: { type: String },
  secure_url: { type: String, required: true },
  public_id: { type: String, required: true, unique: true },
  width: { type: Number, required: true, min: 1 },
  height: { type: Number, required: true, min: 1 },
  format: { type: String, required: true },
}, { timestamps: true });

export const CloudinaryAsset = mongoose.models.CloudinaryAsset
  || mongoose.model<ICloudinaryAsset>("CloudinaryAsset", CloudinaryAssetSchema);
