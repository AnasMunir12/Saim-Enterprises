import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
  type SessionRole,
} from "@/lib/session";
import { User } from "@/models/User";

export type { SessionRole };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Accounts that only use Google sign-in have no password hash; they can never pass a password check.
export async function verifyPassword(password: string, hash?: string | null) {
  if (!hash || typeof hash !== "string") {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

function normalizeRole(role: unknown): SessionRole {
  return role === "admin" ? "admin" : "customer";
}

/**
 * Sets the signed session cookie. The role is embedded in the token so the edge proxy can enforce it.
 * If `role` is omitted it is looked up from the database (missing/unknown => customer).
 */
export async function setSessionCookie(userId: string, role?: SessionRole) {
  let resolvedRole: SessionRole;

  if (role) {
    resolvedRole = normalizeRole(role);
  } else {
    await connectDB();
    const user = await User.findById(userId).select("role").lean();
    resolvedRole = normalizeRole(user?.role);
  }

  const cookieStore = await cookies();
  const token = await createSessionToken(userId, resolvedRole);

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return null;
  }

  await connectDB();
  const user = await User.findById(session.userId).lean();

  if (!user) {
    return null;
  }

  // A suspended customer is signed out everywhere, immediately.
  if (user.status === "suspended") {
    return null;
  }

  // A password reset invalidates every session issued before it.
  if (user.passwordChangedAt && session.iat < new Date(user.passwordChangedAt).getTime()) {
    return null;
  }

  // The database is the source of truth for the role (so demotions take effect immediately);
  // the token role is only a fast path for the edge proxy.
  return {
    id: String(user._id),
    name: user.name as string,
    email: user.email as string,
    avatar: (user.avatar as string | undefined) ?? undefined,
    role: normalizeRole(user.role),
  };
}

export async function requireAuth() {
  return (await getCurrentUser()) ?? null;
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function requireAdminUser() {
  return getCurrentAdminUser();
}

// Any signed-in user (customer or admin).
export async function requireCustomerOrAdmin() {
  return getCurrentUser();
}
