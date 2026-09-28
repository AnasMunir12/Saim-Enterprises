import mongoose, { Schema } from "mongoose";

export interface IHomepageSection {
  _id: string;
  key: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  enabled: boolean;
  order: number;
}

const HomepageSectionSchema = new Schema<IHomepageSection>({
  _id: { type: String },
  key: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  buttonText: { type: String, default: "" },
  buttonLink: { type: String, default: "" },
  enabled: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
});

export const HomepageSection = mongoose.models.HomepageSection || mongoose.model<IHomepageSection>("HomepageSection", HomepageSectionSchema);
