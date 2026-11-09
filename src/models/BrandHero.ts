import mongoose, { Schema } from "mongoose";

export interface BrandHeroDocument {
  _id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

const BrandHeroSchema = new Schema<BrandHeroDocument>(
  {
    _id: { type: String, default: "brand-hero" },
    enabled: { type: Boolean, default: false },
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    buttonText: { type: String, default: "" },
    buttonLink: { type: String, default: "" },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && mongoose.models.BrandHero) {
  mongoose.deleteModel("BrandHero");
}

export const BrandHero = mongoose.models.BrandHero || mongoose.model<BrandHeroDocument>("BrandHero", BrandHeroSchema);
