import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Underlined caps link with an arrow, used for "view all" style actions.
export function ArrowLink({ href, children, icon = "right", light, external }: { href: string; children: ReactNode; icon?: "right" | "up-right" | "none"; light?: boolean; external?: boolean }) {
  const className = `link-arrow${light ? " link-arrow--light" : ""}`;
  const Icon = icon === "up-right" ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span>{children}</span>
      {icon !== "none" ? <Icon size={15} aria-hidden="true" /> : null}
    </>
  );
  return external ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    <Link className={className} href={href}>{content}</Link>
  );
}
