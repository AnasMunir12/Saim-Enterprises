import mongoose, { Schema } from "mongoose";

const SocialLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const SettingsSchema = new Schema(
  {
    _id: {
      type: String,
      default: "site-settings",
    },
    websiteName: { type: String, default: "", trim: true },
    logo: { type: String, default: "", trim: true },
    favicon: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    socialLinks: { type: [SocialLinkSchema], default: [] },
    defaultSeoTitle: { type: String, default: "", trim: true },
    defaultSeoDescription: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
