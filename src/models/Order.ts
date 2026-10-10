import mongoose, { Schema } from "mongoose";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface IOrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  shippingAddress?: string;
  notes?: string;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  // True while this order's items are deducted from product stock (set when confirmed, cleared when cancelled).
  stockAdjusted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    _id: { type: String },
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    phone: { type: String },
    shippingAddress: { type: String },
    notes: { type: String },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    stockAdjusted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
