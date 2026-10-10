import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Style = {
  variant?: "dark" | "light" | "outline" | "google" | "on-dark";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
};

export function buttonClass({ variant = "dark", size = "md", block, className }: Style) {
  return ["btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", className].filter(Boolean).join(" ");
}

type ButtonProps = Style & { loading?: boolean; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Button({ variant, size, block, className, loading, children, type = "button", disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} type={type} className={buttonClass({ variant, size, block, className })} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = Style & { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

// Internal paths use next/link; API routes (which redirect) and other sites use a plain anchor.
const isPlain = (href: string) => href.startsWith("/api/") || /^(https?:|mailto:|tel:)/.test(href);

export function ButtonLink({ variant, size, block, className, href, children, ...rest }: ButtonLinkProps) {
  const classes = buttonClass({ variant, size, block, className });
  return isPlain(href) ? (
    <a {...rest} className={classes} href={href}>{children}</a>
  ) : (
    <Link {...rest} className={classes} href={href}>{children}</Link>
  );
}
