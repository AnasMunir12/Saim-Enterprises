import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

const ACTIONS = ["activate", "deactivate", "delete"] as const;

export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let payload: { ids?: unknown; action?: unknown };
    try {
      payload = (await request.json()) as typeof payload;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const action = payload.action;
    if (!(ACTIONS as readonly unknown[]).includes(action)) {
      return NextResponse.json({ message: "Unknown bulk action." }, { status: 400 });
    }
    if (!Array.isArray(payload.ids) || payload.ids.length === 0 || payload.ids.length > 500 || payload.ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ message: "Select between 1 and 500 products." }, { status: 400 });
    }
    const ids = payload.ids as string[];

    if (action === "delete") {
      const result = await Product.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({ affected: result.deletedCount });
    }

    const active = action === "activate";
    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { status: active ? "active" : "inactive", active } },
    );
    return NextResponse.json({ affected: result.modifiedCount, matched: result.matchedCount });
  } catch (error) {
    console.error("Bulk product action failed:", error);
    return NextResponse.json({ message: "Bulk action failed." }, { status: 500 });
  }
}
