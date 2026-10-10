import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

// Shared plumbing for admin API routes, so each handler only contains its own logic.

/** Throw from anywhere inside an `adminRoute` handler to answer with a plain `{ message }` error. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const apiError = (message: string, status = 400) => NextResponse.json({ message }, { status });

export function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === 11000);
}

export type AdminUser = NonNullable<Awaited<ReturnType<typeof requireAdminUser>>>;

type RouteContext<P> = { params: Promise<P> };
type HandlerArgs<P> = { request: Request; params: P; admin: AdminUser };

/**
 * Wraps a route handler: connects to the database, requires a signed-in admin, resolves params and turns
 * thrown ApiErrors (and duplicate-key errors) into JSON responses. Anything else is logged and answered with
 * a generic 500 so internals never reach the client.
 */
export function adminRoute<P = Record<string, never>>(
  action: string,
  handler: (args: HandlerArgs<P>) => Promise<Response>,
  options: { duplicateMessage?: string } = {},
) {
  return async (request: Request, context?: RouteContext<P>): Promise<Response> => {
    try {
      await connectDB();
      const admin = await requireAdminUser();
      if (!admin) return apiError("Unauthorized.", 401);
      const params = (context ? await context.params : {}) as P;
      return await handler({ request, params, admin });
    } catch (error) {
      if (error instanceof ApiError) return apiError(error.message, error.status);
      if (isDuplicateKeyError(error)) return apiError(options.duplicateMessage ?? "That value is already in use.", 409);
      console.error(`${action} failed:`, error);
      return apiError(`Could not ${action}.`, 500);
    }
  };
}

/** Same as adminRoute but for public reads that behave differently for admins (no auth required). */
export async function isAdminRequest() {
  return Boolean(await requireAdminUser());
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Invalid request body.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Invalid request body.");
  return body as Record<string, unknown>;
}

/** Plain JSON for a Mongoose document: `_id` becomes `id`, internals are dropped. */
export function presentDoc(doc: { toObject?: () => Record<string, unknown> } | Record<string, unknown>) {
  const raw = typeof (doc as { toObject?: unknown }).toObject === "function" ? (doc as { toObject: () => Record<string, unknown> }).toObject() : (doc as Record<string, unknown>);
  const { _id, __v, ...rest } = raw;
  void __v;
  return { ...rest, id: String(_id) };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
