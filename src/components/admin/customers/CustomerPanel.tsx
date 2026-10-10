"use client";

import { Ban, Mail, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TextField } from "@/components/admin/FormFields";
import { Alert, Badge, ConfirmDialog, SidePanel, Spinner, secondaryBtn, smallBtn, smallDangerBtn } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate, formatPKR, shortId } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderStatusValue } from "@/lib/order-status";

export type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: "active" | "suspended";
  suspendedAt: string | null;
  signupMethod: "password" | "google" | "both";
  orders: Array<{ id: string; status: OrderStatusValue; total: number; createdAt: string; itemCount: number }>;
  orderCount: number;
  totalSpent: number;
  wishlistCount: number;
};

const METHOD_LABEL = { password: "Email and password", google: "Google", both: "Email and password, plus Google" } as const;

/** Slide-over with a customer's profile, order history and the suspend / reactivate / delete actions. */
export function CustomerPanel({ customerId, onClose, onChanged }: { customerId: string | null; onClose: () => void; onChanged: (message: string) => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<CustomerDetail>(`/api/admin/customers/${id}`, { cache: "no-store" });
      setDetail(data);
      setName(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the customer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;
    const timer = window.setTimeout(() => {
      setDetail(null);
      setActionError("");
      void load(customerId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [customerId, load]);

  async function patch(body: Record<string, unknown>, message: string) {
    if (!detail) return;
    setWorking(true);
    setActionError("");
    try {
      await adminFetch(`/api/admin/customers/${detail.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load(detail.id);
      onChanged(message);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the customer.");
    } finally {
      setWorking(false);
      setConfirm(null);
    }
  }

  async function remove() {
    if (!detail) return;
    setWorking(true);
    try {
      await adminFetch(`/api/admin/customers/${detail.id}`, { method: "DELETE" });
      onChanged(`Customer ${detail.name} deleted.`);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the customer.");
    } finally {
      setWorking(false);
      setConfirm(null);
    }
  }

  const suspended = detail?.status === "suspended";
  const hasOrders = (detail?.orderCount ?? 0) > 0;

  return (
    <>
      <SidePanel open={customerId !== null} title={detail?.name ?? "Customer"} onClose={onClose}>
        {loading && !detail ? <Spinner label="Loading customer" /> : null}
        {error ? <Alert onRetry={() => customerId && void load(customerId)}>{error}</Alert> : null}
        {detail ? (
          <div className="space-y-6 text-sm">
            {actionError ? <Alert onDismiss={() => setActionError("")}>{actionError}</Alert> : null}

            <section className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={suspended ? "red" : "green"}>{suspended ? "Suspended" : "Active"}</Badge>
                <Badge tone="blue">{METHOD_LABEL[detail.signupMethod]}</Badge>
              </div>
              <div className="break-all"><a className="underline" href={`mailto:${detail.email}`}><Mail size={14} className="mr-1 inline" aria-hidden="true" />{detail.email}</a></div>
              <div className="text-stone-500">Joined {formatDate(detail.createdAt)}{suspended && detail.suspendedAt ? ` · suspended ${formatDate(detail.suspendedAt)}` : ""}</div>
            </section>

            <section className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-stone-50 p-3"><div className="text-xl font-semibold">{detail.orderCount}</div><div className="text-xs text-stone-500">Orders</div></div>
              <div className="rounded-xl bg-stone-50 p-3"><div className="text-xl font-semibold">{formatPKR(detail.totalSpent)}</div><div className="text-xs text-stone-500">Total spent</div></div>
              <div className="rounded-xl bg-stone-50 p-3"><div className="text-xl font-semibold">{detail.wishlistCount}</div><div className="text-xs text-stone-500">Wishlist items</div></div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Order history</h4>
              {detail.orders.length === 0 ? (
                <p className="text-stone-500">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {detail.orders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div>
                        <div className="font-medium">{shortId(order.id)}</div>
                        <div className="text-xs text-stone-500">{formatDate(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap">{formatPKR(order.total)}</span>
                        <Badge tone={ORDER_STATUS_TONES[order.status] ?? "stone"}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Edit profile</h4>
              <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void patch({ name }, "Customer name saved."); }}>
                <div className="flex-1"><TextField label="Display name" value={name} onChange={setName} maxLength={100} /></div>
                <button type="submit" className={smallBtn} disabled={working || !name.trim() || name.trim() === detail.name}>Save name</button>
              </form>
              <p className="mt-2 text-xs text-stone-400">The email address and sign-in method belong to the customer and cannot be changed here.</p>
            </section>

            <section className="space-y-3 border-t border-stone-200 pt-4">
              <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Account access</h4>
              {suspended ? (
                <button type="button" className={secondaryBtn} disabled={working} onClick={() => void patch({ status: "active" }, `${detail.name} can sign in again.`)}><RotateCcw size={14} /> Reactivate account</button>
              ) : (
                <button type="button" className={smallDangerBtn} disabled={working} onClick={() => setConfirm("suspend")}><Ban size={12} /> Suspend account</button>
              )}
              <div>
                <button type="button" className={smallDangerBtn} disabled={working || hasOrders} onClick={() => setConfirm("delete")}><Trash2 size={12} /> Delete customer</button>
                {hasOrders ? <p className="mt-1 text-xs text-stone-400">A customer with orders cannot be deleted because the orders must keep their record. Suspend the account instead.</p> : null}
              </div>
            </section>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirm === "suspend"}
        destructive
        busy={working}
        title="Suspend this account?"
        message={<><strong>{detail?.name}</strong> will be signed out everywhere and will not be able to log in (email or Google) until you reactivate the account. Their orders and wishlist are kept.</>}
        confirmLabel="Suspend account"
        onConfirm={() => void patch({ status: "suspended" }, `${detail?.name ?? "Customer"} suspended.`)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        destructive
        busy={working}
        title="Delete this customer?"
        message={<>This permanently deletes <strong>{detail?.name}</strong> ({detail?.email}) and their wishlist. This cannot be undone.</>}
        confirmLabel="Delete customer"
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
