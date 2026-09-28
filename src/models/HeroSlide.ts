import mongoose, { Schema } from "mongoose";

export interface IHeroSlide {
  _id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>({
  _id: { type: String },
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  primaryButtonText: { type: String, default: "Explore collection" },
  primaryButtonUrl: { type: String, default: "/catalog" },
  secondaryButtonText: { type: String, default: "Learn more" },
  secondaryButtonUrl: { type: String, default: "/contact" },
  active: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

export const HeroSlide = mongoose.models.HeroSlide || mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema);
