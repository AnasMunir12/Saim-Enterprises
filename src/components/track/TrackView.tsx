"use client";

import { CheckCircle2, PackageOpen, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderItems } from "@/components/orders/OrderItems";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { ButtonLink, Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, shortId } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { authHref } from "@/lib/auth-redirect";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

const FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;

const DESCRIPTIONS: Record<OrderView["status"], string> = {
  pending: "We have your order and will contact you shortly to confirm it.",
  confirmed: "Your order is confirmed and being prepared.",
  shipped: "Your order is on its way to you.",
  delivered: "Your order has been delivered. We hope you love it.",
  cancelled: "This order was cancelled. If that is a surprise, please message us.",
};

type Load = { kind: "loading" } | { kind: "signed-out" } | { kind: "error" } | { kind: "ready"; orders: OrderView[] };

export function TrackView() {
  const params = useSearchParams();
  const [state, setState] = useState<Load>({ kind: "loading" });
  const [lookup, setLookup] = useState("");
  const wanted = params.get("order") ?? "";

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.status === 401) {
        setState({ kind: "signed-out" });
        return;
      }
      if (!response.ok) throw new Error("orders failed");
      const data = (await response.json()) as { orders: OrderView[] };
      setState({ kind: "ready", orders: data.orders });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load();
  }, [load]);

  const orders = useMemo(() => (state.kind === "ready" ? state.orders : []), [state]);
  const needle = lookup.trim().replace(/^#/, "").toLowerCase();
  const visible = useMemo(
    () => (needle ? orders.filter((order) => order.id.toLowerCase().includes(needle) || shortId(order.id).replace("#", "").toLowerCase().includes(needle)) : orders),
    [orders, needle],
  );

  // Scroll a freshly placed order into view.
  useEffect(() => {
    if (state.kind === "ready" && wanted) document.getElementById(`order-${wanted}`)?.scrollIntoView({ block: "center" });
  }, [state, wanted]);

  if (state.kind === "loading") {
    return <section className="track" aria-busy="true"><Skeleton style={{ height: 260 }} /></section>;
  }

  if (state.kind === "signed-out") {
    const next = `/track${wanted ? `?order=${wanted}` : ""}`;
    return (
      <section className="track">
        <EmptyState title="Sign in to see your orders." actions={<><ButtonLink href={authHref("login", next)}>Sign in</ButtonLink><Link className="text-link" href={authHref("signup", next)}>Create an account</Link></>}>
          Orders are linked to your account, so only you can see them.
        </EmptyState>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="track">
        <EmptyState role="alert" title="We could not load your orders." actions={<Button onClick={() => void load()}>Try again</Button>}>
          Please check your connection and try again.
        </EmptyState>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="track">
        <EmptyState icon={<PackageOpen size={32} aria-hidden="true" />} title="No orders yet." actions={<ButtonLink href="/catalog">Start shopping</ButtonLink>}>
          When you place an order, you can follow it here.
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="track">
      {orders.length > 1 ? (
        <label className="track__lookup">
          <Search size={18} aria-hidden="true" />
          <input value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Find an order by reference, e.g. A1B2C3D4" aria-label="Find an order by reference" />
        </label>
      ) : null}

      <p className="track__count" aria-live="polite">{visible.length} {visible.length === 1 ? "order" : "orders"}</p>

      <div className="order-list">
        {visible.map((order) => {
          const cancelled = order.status === "cancelled";
          const reached = FLOW.indexOf(order.status as (typeof FLOW)[number]);
          const ask = `/contact?subject=${encodeURIComponent(`Question about order ${shortId(order.id)}`)}`;
          return (
            <article className={`order-card${wanted === order.id ? " is-highlight" : ""}`} id={`order-${order.id}`} key={order.id}>
              <header className="order-card__head">
                <div>
                  <h2>Order {shortId(order.id)}</h2>
                  <span>Placed {formatDate(order.createdAt, true)}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </header>

              {cancelled ? (
                <p className="track-cancelled"><XCircle size={18} aria-hidden="true" /> {DESCRIPTIONS.cancelled}</p>
              ) : (
                <>
                  <ol className="track-steps" aria-label="Order progress">
                    {FLOW.map((step, index) => (
                      <li key={step} className={index < reached ? "is-done" : index === reached ? "is-current" : ""} aria-current={index === reached ? "step" : undefined}>
                        <span className="track-steps__mark">{index <= reached ? <CheckCircle2 size={18} aria-hidden="true" /> : <i aria-hidden="true" />}</span>
                        <span>{ORDER_STATUS_LABELS[step]}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="track-note">{DESCRIPTIONS[order.status]}</p>
                </>
              )}

              <OrderItems items={order.items} />

              <footer className="order-card__foot">
                <div>
                  {order.shippingAddress ? <p>Delivering to: {order.shippingAddress}</p> : null}
                  {order.updatedAt && order.updatedAt !== order.createdAt ? <p>Last updated {formatDate(order.updatedAt, true)}</p> : null}
                </div>
                <div>
                  <strong>Total {formatPrice(order.total)}</strong>
                  <div><Link className="text-link" href={ask}>Ask about this order</Link></div>
                </div>
              </footer>
            </article>
          );
        })}
        {visible.length === 0 ? <EmptyState title="No order matches that reference." /> : null}
      </div>
    </section>
  );
}
