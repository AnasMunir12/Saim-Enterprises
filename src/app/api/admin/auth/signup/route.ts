import { NextResponse } from "next/server";

import { hashPassword, setSessionCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    try {
      body = (await request.json()) as {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
      };
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must contain at least 6 characters." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    await connectDB();
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "user",
    });

    await setSessionCookie(String(user._id));

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: { id: String(user._id), name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    console.error("Admin signup failed:", error);
    return NextResponse.json({ message: "Could not create your account." }, { status: 500 });
  }
}
