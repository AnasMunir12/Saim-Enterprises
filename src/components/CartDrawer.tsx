"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/StoreProvider";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, subtotal, changeQuantity } = useStore();
  return <AnimatePresence>{open && <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.aside className="cart-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} onClick={(event) => event.stopPropagation()}><div className="cart-header"><div><p className="eyebrow">Your selection</p><h2>Shopping bag</h2></div><button className="icon-button" onClick={onClose} aria-label="Close cart"><X size={20} /></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={32} /><p>Your bag is waiting for something special.</p><button className="button button-dark" onClick={onClose}>Continue browsing</button></div> : <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{formatPrice(item.price)}</p><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={12} /></button></div></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><p><Truck size={15} /> Shipping calculated at checkout</p><button className="button button-dark checkout" onClick={onClose}>Checkout <ArrowRight size={16} /></button></div></>}</motion.aside></motion.div>}</AnimatePresence>;
}
