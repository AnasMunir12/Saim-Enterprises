import { NextResponse } from "next/server";

import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { postLoginPath, resolveRole } from "@/lib/auth-redirect";
import { SUSPENDED_MESSAGE, isSuspended } from "@/lib/customers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { email?: unknown; password?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "This account uses Google sign-in. Please use \"Continue with Google\" instead." },
        { status: 401 },
      );
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Checked after the password so the message is only shown to someone who knows the credentials.
    if (isSuspended(user)) {
      return NextResponse.json({ message: SUSPENDED_MESSAGE }, { status: 403 });
    }

    const role = resolveRole(user.role);
    await setSessionCookie(String(user._id), role);

    return NextResponse.json({
      message: "Login successful.",
      user: { id: String(user._id), name: user.name, email: user.email, role },
      redirectTo: postLoginPath(role),
    });
  } catch (error) {
    console.error("Customer login failed:", error);
    return NextResponse.json({ message: "Unable to log in." }, { status: 500 });
  }
}
