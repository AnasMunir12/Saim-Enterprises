import mongoose, { type Document, Schema } from "mongoose";

// "admin" is the super admin (full dashboard access). "customer" is a storefront shopper.
export type UserRole = "admin" | "customer";
// A suspended account cannot sign in and its existing sessions stop working. Accounts without a status are active.
export type UserStatus = "active" | "suspended";

export interface ICheckoutDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  // Absent for accounts that only ever signed in with Google.
  passwordHash?: string;
  role: UserRole;
  status?: UserStatus;
  suspendedAt?: Date;
  googleId?: string;
  avatar?: string;
  checkoutDetails?: ICheckoutDetails;
  // Sessions issued before this moment are rejected (set when the password is reset).
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutDetailsSchema = new Schema<ICheckoutDetails>(
  {
    fullName: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    suspendedAt: {
      type: Date,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    checkoutDetails: { type: CheckoutDetailsSchema, default: undefined },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// In dev, hot reload keeps the first-registered model around, so schema edits (e.g. new enum values) would be ignored.
if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  mongoose.deleteModel("User");
}

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
