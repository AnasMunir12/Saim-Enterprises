import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { isMessageStatus, MESSAGE_STATUSES } from "@/lib/contact-message";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const q = (params.get("q") ?? "").trim().slice(0, 80);
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20));

    if (status && status !== "all" && !isMessageStatus(status)) {
      return NextResponse.json({ message: "Invalid status filter." }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { subject: pattern }, { message: pattern }];
    }

    const [rows, total, statusCounts] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = Object.fromEntries(MESSAGE_STATUSES.map((value) => [value, 0]));
    for (const row of statusCounts as Array<{ _id: string; count: number }>) counts[row._id] = row.count;

    return NextResponse.json(
      {
        messages: (rows as unknown as Array<Record<string, unknown>>).map(({ _id, ipHash, __v, message, ...rest }) => {
          void ipHash;
          void __v;
          const text = typeof message === "string" ? message : "";
          return { ...rest, id: String(_id), preview: text.length > 140 ? `${text.slice(0, 140)}...` : text };
        }),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        counts,
        unread: counts.new,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin messages read failed:", error);
    return NextResponse.json({ message: "Unable to load customer queries." }, { status: 500 });
  }
}
