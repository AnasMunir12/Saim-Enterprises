"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, ClipboardList, Mail, PackageX, ShoppingBag, Users, Package } from "lucide-react";
import { Alert, Badge, EmptyState, Spinner, cardCls } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate, formatPKR, shortId } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderStatusValue } from "@/lib/order-status";

type Stats = {
  lowStockThreshold: number;
  kpis: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    pendingOrders: number;
    totalOrders: number;
    revenue: number;
    customers: number;
    unreadMessages: number;
  };
  recentOrders: Array<{ id: string; customerName: string; customerEmail: string; total: number; status: OrderStatusValue; createdAt: string; itemCount: number }>;
  lowStockProducts: Array<{ id: string; name: string; sku: string; stock: number; image: string; status: string }>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await adminFetch<Stats>("/api/admin/stats"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading && !stats) return <Spinner label="Loading dashboard" />;
  if (error && !stats) return <Alert onRetry={() => void load()}>{error}</Alert>;
  if (!stats) return null;

  const { kpis } = stats;
  const cards = [
    { label: "Total products", value: kpis.totalProducts, icon: Package, href: "/admin/products" },
    { label: "Active products", value: kpis.activeProducts, icon: CheckCircle2, href: "/admin/products?status=active" },
    { label: "Out of stock", value: kpis.outOfStock, icon: PackageX, href: "/admin/products?stock=out", warn: kpis.outOfStock > 0 },
    { label: `Low stock (${stats.lowStockThreshold} or fewer)`, value: kpis.lowStock, icon: AlertTriangle, href: "/admin/products?stock=low", warn: kpis.lowStock > 0 },
    { label: "Unread queries", value: kpis.unreadMessages, icon: Mail, href: "/admin/queries?status=new", warn: kpis.unreadMessages > 0 },
    { label: "Orders pending", value: kpis.pendingOrders, icon: ClipboardList, href: "/admin/orders?status=pending" },
    { label: "Revenue (excl. cancelled)", value: formatPKR(kpis.revenue), icon: Banknote, href: "/admin/orders" },
    { label: "Customers", value: kpis.customers, icon: Users, href: "/admin/customers" },
    { label: "Total orders", value: kpis.totalOrders, icon: ShoppingBag, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      {error ? <Alert onRetry={() => void load()}>{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, warn }) => (
          <Link key={label} href={href} className={`${cardCls} block transition hover:border-stone-400 hover:shadow`}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.15em] text-stone-500">{label}</p>
              <Icon size={16} className={warn ? "text-amber-600" : "text-stone-400"} aria-hidden="true" />
            </div>
            <p className={`mt-4 text-3xl font-semibold tracking-tight ${warn ? "text-amber-700" : ""}`}>{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className={`${cardCls} min-w-0`} aria-labelledby="recent-orders">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-orders" className="text-xl font-semibold tracking-tight">Recent orders</h2>
            <Link className="text-sm text-stone-600 underline" href="/admin/orders">View all</Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" text="Orders placed on the storefront will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-stone-100">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{shortId(order.id)}</div>
                        <div className="text-xs text-stone-500">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-stone-500">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</div>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatPKR(order.total)}</td>
                      <td className="py-3"><Badge tone={ORDER_STATUS_TONES[order.status] ?? "stone"}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${cardCls} min-w-0`} aria-labelledby="low-stock">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="low-stock" className="text-xl font-semibold tracking-tight">Low stock</h2>
            <Link className="text-sm text-stone-600 underline" href="/admin/products?stock=low">Manage</Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <EmptyState title="Stock levels look healthy" text={`No product has ${stats.lowStockThreshold} or fewer units left.`} />
          ) : (
            <ul className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image ? <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <div className="h-10 w-10 shrink-0 rounded-lg bg-stone-200" />}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-stone-500">{product.sku || "No SKU"}</div>
                    </div>
                  </div>
                  <Badge tone={product.stock <= 0 ? "red" : "amber"}>{product.stock <= 0 ? "Out of stock" : `${product.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
