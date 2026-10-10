import type { ReactNode } from "react";

export function EmptyState({ icon, title, children, actions, role }: { icon?: ReactNode; title: string; children?: ReactNode; actions?: ReactNode; role?: "alert" }) {
  return (
    <div className="empty-state" role={role}>
      {icon}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
      {actions ? <div className="empty-state__actions">{actions}</div> : null}
    </div>
  );
}
