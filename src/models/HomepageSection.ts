import mongoose, { Schema } from "mongoose";

export interface ISectionItem {
  title: string;
  text: string;
  image: string;
}

export interface IHomepageSection {
  _id: string;
  key: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  categoryIds?: string[];
  items: ISectionItem[];
  enabled: boolean;
  order: number;
}

const SectionItemSchema = new Schema<ISectionItem>({
  title: { type: String, default: "" },
  text: { type: String, default: "" },
  image: { type: String, default: "" },
}, { _id: false });

const HomepageSectionSchema = new Schema<IHomepageSection>({
  _id: { type: String },
  key: { type: String, required: true, trim: true, unique: true },
  title: { type: String, default: "", trim: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  buttonText: { type: String, default: "" },
  buttonLink: { type: String, default: "" },
  categoryIds: { type: [String], default: undefined },
  items: { type: [SectionItemSchema], default: [] },
  enabled: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
});

// In development a hot reload keeps the model registered with the schema it first had; re-register it so schema edits apply.
if (process.env.NODE_ENV !== "production" && mongoose.models.HomepageSection) {
  mongoose.deleteModel("HomepageSection");
}

export const HomepageSection = mongoose.models.HomepageSection || mongoose.model<IHomepageSection>("HomepageSection", HomepageSectionSchema);
