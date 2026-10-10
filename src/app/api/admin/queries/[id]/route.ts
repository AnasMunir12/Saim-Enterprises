import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { cleanText, isMessageStatus } from "@/lib/contact-message";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function present(doc: Record<string, unknown>) {
  const { _id, ipHash, __v, ...rest } = doc;
  void ipHash;
  void __v;
  return { ...rest, id: String(_id) };
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const doc = await ContactMessage.findById(id).lean();
    if (!doc) return NextResponse.json({ message: "Query not found." }, { status: 404 });
    return NextResponse.json(present(doc as unknown as Record<string, unknown>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin message read failed:", error);
    return NextResponse.json({ message: "Unable to load the query." }, { status: 500 });
  }
}

// Change the status (new / read / replied / archived) and/or the owner's private note.
export async function PATCH(request: Request, { params }: Context) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    let payload: { status?: unknown; adminNote?: unknown };
    try {
      payload = (await request.json()) as typeof payload;
      if (!payload || typeof payload !== "object") throw new Error("not an object");
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (payload.status !== undefined) {
      if (!isMessageStatus(payload.status)) return NextResponse.json({ message: "A valid status is required." }, { status: 400 });
      update.status = payload.status;
    }
    if (payload.adminNote !== undefined) {
      if (typeof payload.adminNote !== "string") return NextResponse.json({ message: "The note must be text." }, { status: 400 });
      const note = cleanText(payload.adminNote, true);
      if (note.length > 1000) return NextResponse.json({ message: "The note must be 1000 characters or fewer." }, { status: 400 });
      update.adminNote = note;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
    }

    const updated = await ContactMessage.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after", runValidators: true }).lean();
    if (!updated) return NextResponse.json({ message: "Query not found." }, { status: 404 });
    return NextResponse.json(present(updated as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Admin message update failed:", error);
    return NextResponse.json({ message: "Could not update the query." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const deleted = await ContactMessage.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ message: "Query not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin message delete failed:", error);
    return NextResponse.json({ message: "Could not delete the query." }, { status: 500 });
  }
}
