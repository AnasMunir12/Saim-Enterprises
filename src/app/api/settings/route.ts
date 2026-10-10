import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getSettings, parseSettingsInput, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Public: these are the details printed on the storefront (phone, email, address, links, announcement).
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings, { headers: NO_STORE });
  } catch (error) {
    console.error("Settings read failed:", error);
    return NextResponse.json({ message: "Unable to load settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      const parsed = (await request.json()) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      payload = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const input = parseSettingsInput(payload);
    if (!input.ok) {
      return NextResponse.json({ message: input.message }, { status: 400 });
    }

    const settings = await updateSettings(input.value);
    return NextResponse.json(settings, { headers: NO_STORE });
  } catch (error) {
    console.error("Settings update failed:", error);
    return NextResponse.json({ message: "Unable to save settings." }, { status: 500 });
  }
}
