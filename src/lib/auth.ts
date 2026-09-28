import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "@/lib/session";
import { User } from "@/models/User";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const token = await createSessionToken(userId);

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

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    // Existing users predate role support and retain legacy admin access.
    role: user.role ?? "admin",
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
