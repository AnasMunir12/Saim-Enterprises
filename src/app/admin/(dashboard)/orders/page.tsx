"use client";

import { Eye, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, ConfirmDialog, EmptyState, PageHeader, Pagination, SidePanel, Spinner, cardCls, inputCls, smallBtn, useDebounced } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate, formatPKR, shortId } from "@/lib/format";
import { ALLOWED_TRANSITIONS, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_TONES, STOCK_HOLDING_STATUSES, type OrderStatusValue } from "@/lib/order-status";

type OrderItem = { productId: string; name: string; image?: string; price: number; quantity: number };
type OrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  shippingAddress?: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatusValue;
  stockAdjusted?: boolean;
  createdAt: string;
  updatedAt: string;
};
type OrdersResponse = { orders: OrderRow[]; total: number; page: number; pages: number; counts: Record<string, number> };

function StatusSelect({ order, onChange, disabled }: { order: OrderRow; onChange: (status: OrderStatusValue) => void; disabled?: boolean }) {
  const options = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (options.length === 0) return <span className="text-xs text-stone-400">Final</span>;
  return (
    <select
      aria-label={`Change status for order ${shortId(order.id)}`}
      value=""
      disabled={disabled}
      onChange={(event) => { if (event.target.value) onChange(event.target.value as OrderStatusValue); }}
      className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs"
    >
      <option value="">Move to...</option>
      {options.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
    </select>
  );
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [status, setStatus] = useState<"all" | OrderStatusValue>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [viewing, setViewing] = useState<OrderRow | null>(null);
  const [pending, setPending] = useState<{ order: OrderRow; to: OrderStatusValue } | null>(null);
  const [busy, setBusy] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const q = useDebounced(search.trim(), 300);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initial = new URLSearchParams(window.location.search).get("status");
      if (initial && (ORDER_STATUSES as readonly string[]).includes(initial)) setStatus(initial as OrderStatusValue);
      setInitialised(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      setData(await adminFetch<OrdersResponse>(`/api/admin/orders?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    if (!initialised) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, initialised]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function requestChange(order: OrderRow, to: OrderStatusValue) {
    setPending({ order, to });
  }

  async function applyChange() {
    if (!pending) return;
    setBusy(true);
    try {
      const updated = await adminFetch<OrderRow>(`/api/admin/orders/${pending.order.id}`, { method: "PATCH", body: JSON.stringify({ status: pending.to }) });
      setNotice({ tone: "success", text: `Order ${shortId(updated.id)} is now ${ORDER_STATUS_LABELS[updated.status]}.${pending.to === "confirmed" ? " Stock was deducted." : pending.to === "cancelled" && pending.order.stockAdjusted ? " Stock was restored." : ""}` });
      setViewing((current) => (current && current.id === updated.id ? updated : current));
      setPending(null);
      await load();
    } catch (err) {
      setPending(null);
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Could not update the order." });
    } finally {
      setBusy(false);
    }
  }

  const counts = data?.counts ?? {};
  const allCount = ORDER_STATUSES.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  const tabs: Array<{ key: "all" | OrderStatusValue; label: string; count: number }> = [
    { key: "all", label: "All", count: allCount },
    ...ORDER_STATUSES.map((key) => ({ key, label: ORDER_STATUS_LABELS[key], count: counts[key] ?? 0 })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sales" title="Orders" description="Confirming an order deducts stock. Cancelling a confirmed order puts it back." />

      {notice ? <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className={cardCls}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter orders by status">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={status === tab.key}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${status === tab.key ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"}`}
              >
                {tab.label} <span className="opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email, phone, ID" aria-label="Search orders" className={`${inputCls} pl-9`} />
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading orders" />
        ) : error ? (
          <div className="mt-4"><Alert onRetry={() => { setLoading(true); void load(); }}>{error}</Alert></div>
        ) : !data || data.orders.length === 0 ? (
          <EmptyState title={status === "all" && !q ? "No orders yet" : "No orders match"} text={status === "all" && !q ? "Orders placed on the storefront will show up here." : "Try another status or search term."} />
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Items</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id} className="border-b border-stone-100 align-middle">
                      <td className="py-3 pr-4"><div className="font-medium">{shortId(order.id)}</div><div className="text-xs text-stone-500">{formatDate(order.createdAt, true)}</div></td>
                      <td className="py-3 pr-4"><div>{order.customerName}</div><div className="text-xs text-stone-500">{order.customerEmail}</div></td>
                      <td className="py-3 pr-4">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatPKR(order.total)}</td>
                      <td className="py-3 pr-4"><Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge></td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <StatusSelect order={order} onChange={(to) => requestChange(order, to)} />
                          <button type="button" className={smallBtn} onClick={() => setViewing(order)}><Eye size={12} /> View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 md:hidden">
              {data.orders.map((order) => (
                <li key={order.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{shortId(order.id)} · {formatPKR(order.total)}</div>
                      <div className="text-sm">{order.customerName}</div>
                      <div className="text-xs text-stone-500">{formatDate(order.createdAt, true)}</div>
                    </div>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusSelect order={order} onChange={(to) => requestChange(order, to)} />
                    <button type="button" className={smallBtn} onClick={() => setViewing(order)}>View</button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>

      <SidePanel open={viewing !== null} title={viewing ? `Order ${shortId(viewing.id)}` : "Order"} onClose={() => setViewing(null)}>
        {viewing ? (
          <div className="space-y-6 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={ORDER_STATUS_TONES[viewing.status]}>{ORDER_STATUS_LABELS[viewing.status]}</Badge>
              <StatusSelect order={viewing} onChange={(to) => requestChange(viewing, to)} />
            </div>
            <p className="text-xs text-stone-500">
              Placed {formatDate(viewing.createdAt, true)} · Stock {STOCK_HOLDING_STATUSES.has(viewing.status) && viewing.stockAdjusted ? "deducted for this order" : "not deducted"}
            </p>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Customer</h4>
              <div className="font-medium">{viewing.customerName}</div>
              <div className="text-stone-600">{viewing.customerEmail}</div>
              {viewing.phone ? <div className="text-stone-600">{viewing.phone}</div> : null}
              {viewing.shippingAddress ? <div className="mt-2 whitespace-pre-line text-stone-600">{viewing.shippingAddress}</div> : <div className="mt-2 text-stone-400">No shipping address</div>}
              {viewing.notes ? <p className="mt-2 rounded-lg bg-stone-100 p-3 text-stone-700">Note: {viewing.notes}</p> : null}
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Items</h4>
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {viewing.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex items-center gap-3 p-3">
                    {item.image ? <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-200" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="text-xs text-stone-500">{formatPKR(item.price)} x {item.quantity}</div>
                    </div>
                    <div className="font-medium">{formatPKR(item.price * item.quantity)}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between text-base font-semibold"><span>Total</span><span>{formatPKR(viewing.total)}</span></div>
            </section>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={pending !== null}
        busy={busy}
        destructive={pending?.to === "cancelled"}
        title={pending ? `Move order ${shortId(pending.order.id)} to ${ORDER_STATUS_LABELS[pending.to]}?` : ""}
        message={
          pending?.to === "confirmed" ? "Stock for every item in this order will be deducted. This fails if any item does not have enough stock."
          : pending?.to === "cancelled" ? (pending.order.stockAdjusted ? "The order will be cancelled and its items returned to stock." : "The order will be cancelled.")
          : "The customer's order status will be updated."
        }
        confirmLabel={pending ? `Mark ${ORDER_STATUS_LABELS[pending.to].toLowerCase()}` : "Confirm"}
        onConfirm={() => void applyChange()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
