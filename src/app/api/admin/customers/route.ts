import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Customer list. Only whitelisted fields are projected: never passwordHash or googleId (only whether each exists).
export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const q = (params.get("q") ?? "").trim().slice(0, 80);
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20));

    const status = params.get("status");
    const match: Record<string, unknown> = { role: "customer" };
    if (status === "suspended") match.status = "suspended";
    if (status === "active") match.status = { $ne: "suspended" };
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      match.$or = [{ name: pattern }, { email: pattern }];
    }

    const [result] = await User.aggregate([
      { $match: match },
      {
        $facet: {
          total: [{ $count: "count" }],
          rows: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "orders",
                let: { uid: { $toString: "$_id" } },
                pipeline: [
                  { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
                  { $group: { _id: null, orderCount: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$total"] } } } },
                ],
                as: "orderStats",
              },
            },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                name: 1,
                email: 1,
                avatar: 1,
                createdAt: 1,
                status: { $ifNull: ["$status", "active"] },
                hasPassword: { $gt: [{ $strLenCP: { $ifNull: ["$passwordHash", ""] } }, 0] },
                hasGoogle: { $gt: [{ $strLenCP: { $ifNull: ["$googleId", ""] } }, 0] },
                orderCount: { $ifNull: [{ $first: "$orderStats.orderCount" }, 0] },
                totalSpent: { $ifNull: [{ $first: "$orderStats.totalSpent" }, 0] },
              },
            },
          ],
        },
      },
    ]);

    const total = (result?.total?.[0]?.count as number | undefined) ?? 0;
    return NextResponse.json({
      customers: result?.rows ?? [],
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin customers read failed:", error);
    return NextResponse.json({ message: "Unable to load customers." }, { status: 500 });
  }
}
