import type { ReactNode } from "react";

// Inline message. Errors announce themselves (role=alert); success and info are polite status updates.
export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "warning"; children: ReactNode }) {
  return <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}
