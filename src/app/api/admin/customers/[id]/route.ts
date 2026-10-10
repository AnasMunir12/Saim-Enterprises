import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { findManageableCustomer, isSuspended, signupMethod } from "@/lib/customers";
import { parseFields } from "@/lib/validate";
import { Order } from "@/models/Order";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { Wishlist } from "@/models/Wishlist";
import type { IUser } from "@/models/User";

export const dynamic = "force-dynamic";

type Params = { id: string };

// Nothing secret leaves the server: no passwordHash, no googleId, only whether each sign-in method exists.
function profile(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? "",
    createdAt: user.createdAt,
    status: isSuspended(user) ? "suspended" : "active",
    suspendedAt: user.suspendedAt ?? null,
    signupMethod: signupMethod(user),
    hasPassword: Boolean(user.passwordHash),
    hasGoogle: Boolean(user.googleId),
  };
}

export const GET = adminRoute<Params>("load the customer", async ({ params, admin }) => {
  const customer = await findManageableCustomer(params.id, admin.id);
  const [orders, wishlist] = await Promise.all([
    Order.find({ userId: params.id }).sort({ createdAt: -1 }).limit(100).select("status total createdAt items").lean(),
    Wishlist.findOne({ userId: params.id }).select("productIds").lean<{ productIds?: string[] }>(),
  ]);
  const rows = (orders as unknown as Array<Record<string, unknown>>).map((order) => ({
    id: String(order._id),
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    itemCount: Array.isArray(order.items) ? (order.items as Array<{ quantity?: number }>).reduce((sum, item) => sum + (item.quantity ?? 0), 0) : 0,
  }));
  return ok({
    ...profile(customer),
    orders: rows,
    orderCount: rows.length,
    totalSpent: rows.reduce((sum, order) => sum + (order.status === "cancelled" ? 0 : Number(order.total ?? 0)), 0),
    wishlistCount: wishlist?.productIds?.length ?? 0,
  });
});

// Edits the display name or suspends / reactivates the account. The role can never be changed from here.
export const PATCH = adminRoute<Params>("update the customer", async ({ request, params, admin }) => {
  const customer = await findManageableCustomer(params.id, admin.id);
  const body = await readJsonObject(request);
  const values = parseFields(body, { name: { type: "text", label: "Name", max: 100, required: true } }, { partial: true });

  if ("status" in body && body.status !== "active" && body.status !== "suspended") throw new ApiError("Status must be active or suspended.");
  if (!("status" in body) && !("name" in values)) throw new ApiError("Nothing to update.");

  if (typeof values.name === "string") customer.name = values.name;
  if (body.status === "suspended" && !isSuspended(customer)) {
    customer.status = "suspended";
    customer.suspendedAt = new Date();
  } else if (body.status === "active") {
    customer.status = "active";
    customer.suspendedAt = undefined;
  }
  await customer.save();
  return ok(profile(customer));
});

// Customers with orders cannot be deleted: the orders must keep a real, traceable customer (suspend instead).
export const DELETE = adminRoute<Params>("delete the customer", async ({ params, admin }) => {
  const customer = await findManageableCustomer(params.id, admin.id);
  const orders = await Order.countDocuments({ userId: params.id });
  if (orders > 0) {
    throw new ApiError(`This customer has ${orders} order${orders === 1 ? "" : "s"} on record, so the account cannot be deleted. Suspend it instead to block sign-in.`, 409);
  }
  await Promise.all([Wishlist.deleteMany({ userId: params.id }), PasswordResetToken.deleteMany({ userId: customer._id })]);
  await customer.deleteOne();
  return ok({ message: "Customer deleted." });
});
