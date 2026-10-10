import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "sale" | "soldout" | "low" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export function Badge({ tone = "neutral", pill, children }: { tone?: BadgeTone; pill?: boolean; children: ReactNode }) {
  return <span className={`badge${tone !== "neutral" ? ` badge--${tone}` : ""}${pill ? " badge--pill" : ""}`}>{children}</span>;
}
