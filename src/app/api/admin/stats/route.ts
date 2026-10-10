import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { connectDB } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const [totalProducts, activeProducts, outOfStock, lowStock, pendingOrders, totalOrders, revenueAgg, customers, unreadMessages, recentOrders, lowStockProducts] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({}),
      Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),
      User.countDocuments({ role: "customer" }),
      ContactMessage.countDocuments({ status: "new" }),
      Order.find().sort({ createdAt: -1 }).limit(6).select("customerName customerEmail total status createdAt items").lean(),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1, name: 1 }).limit(8).select("name sku stock image status").lean(),
    ]);

    return NextResponse.json({
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      kpis: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        pendingOrders,
        totalOrders,
        revenue: (revenueAgg[0]?.revenue as number | undefined) ?? 0,
        customers,
        unreadMessages,
      },
      recentOrders: (recentOrders as unknown as Array<Record<string, unknown>>).map((order) => ({
        id: String(order._id),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: Array.isArray(order.items) ? (order.items as Array<{ quantity?: number }>).reduce((sum, item) => sum + (item.quantity ?? 0), 0) : 0,
      })),
      lowStockProducts: (lowStockProducts as unknown as Array<Record<string, unknown>>).map((product) => ({
        id: String(product._id),
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        image: product.image,
        status: product.status,
      })),
    });
  } catch (error) {
    console.error("Admin stats failed:", error);
    return NextResponse.json({ message: "Unable to load dashboard stats." }, { status: 500 });
  }
}
