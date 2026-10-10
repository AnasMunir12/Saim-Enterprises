import { createHash, randomBytes } from "crypto";
import { after, NextResponse } from "next/server";

import { buildPasswordResetEmail, sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/google-oauth";
import { connectDB } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const LIMIT_PER_HOUR = 5;

// Identical for known and unknown emails, so the endpoint cannot be used to enumerate accounts.
const GENERIC_MESSAGE = "If an account exists for that email, we've sent a link to reset your password.";

async function issueResetEmail(email: string) {
  await connectDB();
  const user = await User.findOne({ email }).select("name email passwordHash").lean();

  if (!user) {
    return;
  }

  // Only the hash is stored; the raw token exists only in the emailed link.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // A new request invalidates every earlier unused link for this account.
  await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
  await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) });

  const link = `${getBaseUrl()}/reset-password?token=${token}`;
  const mail = buildPasswordResetEmail({ name: String(user.name ?? ""), link, hasPassword: Boolean(user.passwordHash) });
  await sendEmail({ to: String(user.email), ...mail });
}

export async function POST(request: Request) {
  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  // Counted for every email, existing or not, so the 429 itself reveals nothing.
  const ipAllowed = rateLimit(`forgot:ip:${clientIp(request)}`, LIMIT_PER_HOUR, HOUR_MS);
  const emailAllowed = rateLimit(`forgot:email:${email}`, LIMIT_PER_HOUR, HOUR_MS);

  if (!ipAllowed || !emailAllowed) {
    return NextResponse.json(
      { message: "Too many reset requests. Please try again in an hour." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  // Lookup, token creation and sending happen after the response so timing doesn't depend on the account.
  after(async () => {
    try {
      await issueResetEmail(email);
    } catch (error) {
      console.error("Password reset email failed:", error);
    }
  });

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
