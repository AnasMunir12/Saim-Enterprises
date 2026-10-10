import { StoreImage } from "@/components/ui/StoreImage";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

// Line items of an order, shared by the account history and the tracking page.
export function OrderItems({ items }: { items: OrderView["items"] }) {
  return (
    <ul className="order-card__items">
      {items.map((item) => (
        <li key={item.productId}>
          <span className="order-card__thumb"><StoreImage src={item.image} alt="" /></span>
          <span className="order-card__name">{item.name}<small>Qty {item.quantity} x {formatPrice(item.price)}</small></span>
          <span>{formatPrice(item.price * item.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
