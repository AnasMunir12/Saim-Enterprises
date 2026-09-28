import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings read failed:", error);
    return NextResponse.json({ message: "Unable to load settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const allowedFields = [
      "websiteName",
      "logo",
      "favicon",
      "contactEmail",
      "phone",
      "whatsapp",
      "address",
      "socialLinks",
      "defaultSeoTitle",
      "defaultSeoDescription",
    ] as const;
    const settingsPayload = Object.fromEntries(
      allowedFields
        .filter((field) => field in payload)
        .map((field) => [field, payload[field]]),
    );

    if ("contactEmail" in settingsPayload && typeof settingsPayload.contactEmail !== "string") {
      return NextResponse.json({ message: "Contact email must be text." }, { status: 400 });
    }

    if ("socialLinks" in settingsPayload && !Array.isArray(settingsPayload.socialLinks)) {
      return NextResponse.json({ message: "Social links must be an array." }, { status: 400 });
    }

    const settings = await updateSettings(settingsPayload);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings update failed:", error);
    return NextResponse.json({ message: "Unable to save settings." }, { status: 500 });
  }
}
