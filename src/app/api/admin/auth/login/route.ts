import { NextResponse } from "next/server";

import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string };

    try {
      body = (await request.json()) as { email?: string; password?: string };
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).lean();

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    if (user.role === "user") {
      return NextResponse.json({ message: "This account does not have admin access." }, { status: 403 });
    }

    await setSessionCookie(String(user._id));

    return NextResponse.json({
      message: "Login successful.",
      user: { id: String(user._id), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ message: "Unable to log in." }, { status: 500 });
  }
}
