import { NextResponse } from "next/server";

import { hashPassword, setSessionCookie } from "@/lib/auth";
import { postLoginPath } from "@/lib/auth-redirect";
import { connectDB } from "@/lib/mongodb";
import { validateNewPassword } from "@/lib/password-policy";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const DUPLICATE_MESSAGE = "An account with this email already exists. Try signing in instead.";

export async function POST(request: Request) {
  try {
    let body: { fullName?: unknown; name?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    // Only these fields are read from the body. A client-supplied role is deliberately ignored.
    const str = (value: unknown) => (typeof value === "string" ? value : "");
    const name = (str(body?.fullName) || str(body?.name)).trim();
    const email = str(body?.email).trim().toLowerCase();
    const password = str(body?.password);
    const confirmPassword = str(body?.confirmPassword);

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ message: "Name is too long." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    const passwordError = validateNewPassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email }).select("passwordHash googleId").lean();

    if (existing) {
      const googleOnly = !existing.passwordHash && existing.googleId;
      return NextResponse.json(
        {
          message: googleOnly
            ? "This email is already registered with Google. Please use \"Continue with Google\" to sign in."
            : DUPLICATE_MESSAGE,
        },
        { status: 409 },
      );
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "customer",
    });

    await setSessionCookie(String(user._id), "customer");

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: { id: String(user._id), name: user.name, email: user.email, role: "customer" },
        redirectTo: postLoginPath("customer"),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: DUPLICATE_MESSAGE }, { status: 409 });
    }

    console.error("Customer signup failed:", error);
    return NextResponse.json({ message: "Could not create your account." }, { status: 500 });
  }
}
