import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderView } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: OrderView["status"] }) {
  return <Badge tone={status} pill>{ORDER_STATUS_LABELS[status] ?? status}</Badge>;
}
