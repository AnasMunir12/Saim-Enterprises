import { NextResponse } from "next/server";

import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { email?: unknown; password?: unknown };

    try {
      body = (await request.json()) as { email?: unknown; password?: unknown };
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).lean();

    // verifyPassword is safe for accounts without a password hash (Google-only).
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "This account is not an admin. Please use the customer login." },
        { status: 403 },
      );
    }

    await setSessionCookie(String(user._id), "admin");

    return NextResponse.json({
      message: "Login successful.",
      user: { id: String(user._id), name: user.name, email: user.email, role: "admin" },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ message: "Unable to log in." }, { status: 500 });
  }
}
