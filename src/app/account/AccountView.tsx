"use client";

import { Heart, LogOut, PackageOpen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { OrderItems } from "@/components/orders/OrderItems";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useStore } from "@/components/StoreProvider";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { StoreImage } from "@/components/ui/StoreImage";
import { shortId } from "@/lib/format";
import type { OrderView } from "@/lib/orders";
import { formatPrice, isSoldOut } from "@/lib/products";

export type AccountProduct = { id: string; name: string; slug: string; price: number; compareAtPrice?: number; stock: number; image: string; category: string };
type AccountUser = { id: string; name: string; email: string; role: "admin" | "customer"; avatar: string | null; memberSince: string | null };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Profile({ user, orders, saved }: { user: AccountUser; orders: number; saved: number }) {
  const { signOut } = useStore();
  const [signingOut, setSigningOut] = useState(false);
  return (
    <aside className="card profile profile-card" id="profile" aria-label="Your profile">
      <div className="profile__top">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar hosts are not configured for next/image
          <img className="profile__avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
        ) : <div className="profile__avatar profile__initial" aria-hidden="true">{(user.name[0] ?? "?").toUpperCase()}</div>}
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <dl className="profile__meta">
        {user.memberSince ? <div><dt>Member since</dt><dd>{formatDate(user.memberSince)}</dd></div> : null}
        <div><dt>Orders</dt><dd>{orders}</dd></div>
        <div><dt>Saved pieces</dt><dd>{saved}</dd></div>
      </dl>
      {user.role === "admin" ? <ButtonLink variant="light" block href="/admin/dashboard">Admin dashboard</ButtonLink> : null}
      <Button variant="outline" block loading={signingOut} onClick={() => { setSigningOut(true); void signOut(); }}>
        <LogOut size={15} aria-hidden="true" /> {signingOut ? "Signing out..." : "Sign out"}
      </Button>
    </aside>
  );
}

function WishlistCard({ product, onRemove }: { product: AccountProduct; onRemove: () => void }) {
  const { addToCart } = useStore();
  const soldOut = isSoldOut(product);
  return (
    <article className="wish-item">
      <Link href={`/product/${product.slug}`} className="wish-item__image"><StoreImage src={product.image} alt={product.name} /></Link>
      <div className="wish-item__body">
        <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
        <p>{product.category}</p>
        <strong>{formatPrice(product.price)}</strong>
        {soldOut ? <Badge tone="soldout">Sold out</Badge> : null}
        <div className="wish-item__actions">
          <Button
            variant="light"
            size="sm"
            disabled={soldOut}
            onClick={() => addToCart({ id: product.id, name: product.name, slug: product.slug, price: product.price, compareAtPrice: product.compareAtPrice, category: product.category, image: product.image, detail: "", stock: product.stock, availability: product.stock > 0 ? "In stock" : "Out of stock", status: "active" })}
          >
            {soldOut ? "Sold out" : "Add to bag"}
          </Button>
          <button type="button" className="icon-btn" onClick={onRemove} aria-label={`Remove ${product.name} from wishlist`}><Trash2 size={17} /></button>
        </div>
      </div>
    </article>
  );
}

function OrderHistoryCard({ order }: { order: OrderView }) {
  return (
    <article className="order-card">
      <header className="order-card__head">
        <div>
          <strong>{shortId(order.id)}</strong>
          <span> · {formatDate(order.createdAt)}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <OrderItems items={order.items} />
      <footer className="order-card__foot">
        <p>{order.shippingAddress}</p>
        <strong>Total {formatPrice(order.total)}</strong>
        <ArrowLink href={`/track?order=${encodeURIComponent(order.id)}`}>Track order</ArrowLink>
      </footer>
    </article>
  );
}

export function AccountView({ user, orders, wishlist }: { user: AccountUser; orders: OrderView[]; wishlist: AccountProduct[] }) {
  const { toggleWishlist } = useStore();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const visible = wishlist.filter((product) => !removed.has(product.id));

  function remove(id: string) {
    setRemoved((current) => new Set(current).add(id));
    toggleWishlist(id);
  }

  return (
    <PageChrome>
      <PageHero eyebrow="My account" title={<>Hello, <em>{user.name.split(" ")[0] || "there"}.</em></>} />

      <div className="account">
        <Profile user={user} orders={orders.length} saved={visible.length} />

        <div className="account__main">
          <section className="card" id="wishlist" aria-labelledby="wishlist-title">
            <div className="card__head">
              <h2 id="wishlist-title">Wishlist</h2>
              <span>{visible.length} saved</span>
            </div>
            {visible.length === 0 ? (
              <div className="account-empty">
                <Heart size={28} aria-hidden="true" />
                <p>Nothing saved yet. Tap the heart on any piece to keep it here.</p>
                <ArrowLink href="/catalog">Browse the collection</ArrowLink>
              </div>
            ) : (
              <div className="wish-grid">
                {visible.map((product) => <WishlistCard key={product.id} product={product} onRemove={() => remove(product.id)} />)}
              </div>
            )}
          </section>

          <section className="card" id="orders" aria-labelledby="orders-title">
            <div className="card__head">
              <h2 id="orders-title">Order history</h2>
              <span>{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
            </div>
            {orders.length === 0 ? (
              <div className="account-empty">
                <PackageOpen size={28} aria-hidden="true" />
                <p>You have not placed any orders yet.</p>
                <ArrowLink href="/catalog">Start shopping</ArrowLink>
              </div>
            ) : (
              <div className="order-list">
                {orders.map((order) => <OrderHistoryCard key={order.id} order={order} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageChrome>
  );
}
