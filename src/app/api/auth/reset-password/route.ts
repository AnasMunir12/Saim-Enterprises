import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { validateNewPassword } from "@/lib/password-policy";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const INVALID_LINK = "This reset link has expired or was already used. Please request a new one.";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`reset:ip:${clientIp(request)}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
    }

    let body: { token?: unknown; password?: unknown; confirmPassword?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const str = (value: unknown) => (typeof value === "string" ? value : "");
    const token = str(body?.token);
    const password = str(body?.password);
    const confirmPassword = str(body?.confirmPassword);

    if (!token || token.length > 200 || !password || !confirmPassword) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    const passwordError = validateNewPassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    await connectDB();

    // Lookup is by SHA-256 hash (indexed equality), so no secret is ever compared character by character.
    // The atomic update claims the token: of two concurrent requests only one can succeed.
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const record = await PasswordResetToken.findOneAndUpdate(
      { tokenHash, usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
    ).lean();

    if (!record) {
      return NextResponse.json({ message: INVALID_LINK, code: "invalid_link" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const updated = await User.findByIdAndUpdate(record.userId, {
      $set: { passwordHash, passwordChangedAt: new Date() },
    }).lean();

    if (!updated) {
      return NextResponse.json({ message: INVALID_LINK, code: "invalid_link" }, { status: 400 });
    }

    // Any other outstanding links for this account are now void.
    await PasswordResetToken.deleteMany({ userId: record.userId, usedAt: null });

    return NextResponse.json({ message: "Your password has been updated.", redirectTo: "/login?reset=1" });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ message: "Could not reset your password. Please try again." }, { status: 500 });
  }
}
