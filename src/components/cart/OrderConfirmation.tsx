import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { BUSINESS_EMAIL } from "@/lib/constants";
import { shortId } from "@/lib/format";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export function OrderConfirmation({ order, email, onClose }: { order: OrderView; email?: string; onClose: () => void }) {
  const contact = email || BUSINESS_EMAIL;
  return (
    <div className="order-confirmation">
      <CheckCircle2 size={40} aria-hidden="true" />
      <p className="confirm-lead">Thank you. We have your order.</p>
      <p className="confirm-id">Order <strong>{shortId(order.id)}</strong></p>
      <ul className="confirm-list" aria-label="Order summary">
        {order.items.map((item) => (
          <li key={item.productId}>
            <span>{item.name} <small>x {item.quantity}</small></span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
        <li><strong>Total</strong><strong>{formatPrice(order.total)}</strong></li>
      </ul>
      <ol className="confirm-steps">
        <li><strong>Pending now.</strong> Your order is saved and waiting for our review.</li>
        <li><strong>We contact you</strong> on {order.phone} to confirm and arrange payment and delivery.</li>
        <li><strong>We pack and ship</strong> once it is confirmed. You can follow every step any time.</li>
      </ol>
      <p className="confirm-help">Questions about this order? <a href={`mailto:${contact}?subject=${encodeURIComponent(`Order ${shortId(order.id)}`)}`}>Email {contact}</a>.</p>
      <ButtonLink href={`/track?order=${encodeURIComponent(order.id)}`} size="lg" block onClick={onClose}>Track this order</ButtonLink>
      <button type="button" className="link-arrow" onClick={onClose}><span>Continue shopping</span></button>
    </div>
  );
}
