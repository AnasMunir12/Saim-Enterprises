import { redirect } from "next/navigation";

import { AccountView, type AccountProduct } from "@/app/account/AccountView";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { toOrderView } from "@/lib/orders";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Wishlist } from "@/models/Wishlist";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account | Saim Enterprises" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account&expired=1");
  }

  await connectDB();

  // Every query below is scoped by the session user's id.
  const [record, orders, wishlist] = await Promise.all([
    User.findById(user.id).select("avatar createdAt").lean<{ avatar?: string; createdAt?: Date }>(),
    Order.find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).lean<Array<Record<string, unknown>>>(),
    Wishlist.findOne({ userId: user.id }).lean<{ productIds?: string[] }>(),
  ]);

  const productIds = wishlist?.productIds ?? [];
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds }, active: { $ne: false }, status: "active" }).lean<
        Array<{ _id: string; name: string; slug: string; price: number; compareAtPrice?: number; stock?: number; categoryId: string; image?: string }>
      >()
    : [];
  const categories = products.length
    ? await Category.find({ _id: { $in: [...new Set(products.map((product) => product.categoryId))] } })
        .select("name")
        .lean<Array<{ _id: string; name: string }>>()
    : [];
  const categoryNames = new Map(categories.map((category) => [String(category._id), category.name]));

  const wishlistProducts: AccountProduct[] = products.map((product) => ({
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: product.image ?? "",
    compareAtPrice: product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : undefined,
    stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
    category: categoryNames.get(product.categoryId) ?? "Uncategorized",
  }));

  return (
    <AccountView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: record?.avatar ?? null,
        memberSince: record?.createdAt ? record.createdAt.toISOString() : null,
      }}
      orders={orders.map(toOrderView)}
      wishlist={wishlistProducts}
    />
  );
}
