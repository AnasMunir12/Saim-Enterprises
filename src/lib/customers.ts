import mongoose from "mongoose";

import { ApiError } from "@/lib/api";
import { User } from "@/models/User";

export const SUSPENDED_MESSAGE = "This account has been suspended. Please contact Saim Enterprises for help.";

/** Accounts created before suspension existed have no status and count as active. */
export const isSuspended = (user: { status?: string | null } | null | undefined) => user?.status === "suspended";

export type SignupMethod = "password" | "google" | "both";

export function signupMethod(user: { passwordHash?: string | null; googleId?: string | null }): SignupMethod {
  const password = Boolean(user.passwordHash);
  const google = Boolean(user.googleId);
  return password && google ? "both" : google ? "google" : "password";
}

/**
 * Loads the customer an admin action targets. Only role "customer" accounts can be managed this way:
 * the admin account (including the signed-in one) is never reachable, whatever id the request carries.
 */
export async function findManageableCustomer(id: string, adminId: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Customer not found.", 404);
  if (id === adminId) throw new ApiError("You cannot change your own account here.", 403);
  const customer = await User.findById(id);
  if (!customer) throw new ApiError("Customer not found.", 404);
  if (customer.role !== "customer") throw new ApiError("Only customer accounts can be managed here.", 403);
  return customer;
}
