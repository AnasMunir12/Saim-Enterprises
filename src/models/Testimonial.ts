import mongoose, { Schema } from "mongoose";

export interface ITestimonial {
  _id: string;
  name: string;
  role: string;
  quote: string;
  image?: string;
  // 1 to 5; absent when the owner chose not to show stars.
  rating?: number;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  role: { type: String, default: "" },
  quote: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  rating: { type: Number, min: 1, max: 5 },
  active: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

// In development a hot reload keeps the model registered with the schema it first had; re-register it so schema edits apply.
if (process.env.NODE_ENV !== "production" && mongoose.models.Testimonial) {
  mongoose.deleteModel("Testimonial");
}

export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);
