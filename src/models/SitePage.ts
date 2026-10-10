import mongoose, { Schema } from "mongoose";

// An information page the owner has edited (the slug is the id, see lib/site-pages.ts). Pages never edited have no
// document and show their built-in wording.
export interface ISitePage {
  _id: string;
  title: string;
  intro: string;
  body: string;
}

const SitePageSchema = new Schema<ISitePage>({
  _id: { type: String },
  title: { type: String, required: true, trim: true },
  intro: { type: String, default: "" },
  body: { type: String, default: "" },
}, { timestamps: true });

// In development a hot reload keeps the model registered with the schema it first had; re-register it so schema edits apply.
if (process.env.NODE_ENV !== "production" && mongoose.models.SitePage) {
  mongoose.deleteModel("SitePage");
}

export const SitePage = mongoose.models.SitePage || mongoose.model<ISitePage>("SitePage", SitePageSchema);
