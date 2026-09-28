import mongoose, { Schema } from "mongoose";

export interface ITestimonial {
  _id: string;
  name: string;
  role: string;
  quote: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  role: { type: String, default: "" },
  quote: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);
