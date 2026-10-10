import type { ReactNode } from "react";
import { PageChrome } from "@/components/layout/PageChrome";

// Sign-in style pages share the storefront header and footer with a centred card.
export function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <PageChrome>
      <section className="auth">
        <div className={`auth__card${wide ? " auth__card--wide" : ""}`}>{children}</div>
      </section>
    </PageChrome>
  );
}

export function AuthHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="auth__head">
      <p className="eyebrow">Saim Enterprises</p>
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
