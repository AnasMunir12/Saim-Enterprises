import mongoose, { Schema } from "mongoose";

// One document per editable list (the key is the id, see lib/content-lists.ts). `items` is the whole list in display
// order; its shape depends on the list and is validated by the API before every write.
const ContentListSchema = new Schema(
  {
    _id: { type: String },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

// In development a hot reload keeps the model registered with the schema it first had; re-register it so schema edits apply.
if (process.env.NODE_ENV !== "production" && mongoose.models.ContentList) {
  mongoose.deleteModel("ContentList");
}

export const ContentList = mongoose.models.ContentList || mongoose.model("ContentList", ContentListSchema);
