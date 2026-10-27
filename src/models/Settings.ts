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
    logoDesktopWidth: { type: Number, default: 220, min: 64, max: 320 },
    logoMobileWidth: { type: Number, default: 160, min: 48, max: 240 },
    logoMaxHeight: { type: Number, default: 48, min: 24, max: 56 },
    logoObjectFit: { type: String, enum: ["contain", "cover"], default: "contain" },
    favicon: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    businessOrderEmail: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    showWhatsappButton: { type: Boolean, default: true },
    address: { type: String, default: "", trim: true },
    openingHours: { type: String, default: "", trim: true },
    announcement: { type: String, default: "", trim: true },
    socialLinks: { type: [SocialLinkSchema], default: [] },
    defaultSeoTitle: { type: String, default: "", trim: true },
    defaultSeoDescription: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

// In development a hot reload keeps the model registered with the schema it first had, silently dropping
// newly added fields. Re-register it so schema edits apply without restarting the dev server.
if (process.env.NODE_ENV !== "production" && mongoose.models.Settings) {
  mongoose.deleteModel("Settings");
}

export const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
