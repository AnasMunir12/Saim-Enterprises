import type { ReactNode } from "react";

type ButtonProps = { children: ReactNode; href?: string; variant?: "dark" | "light" | "outline"; type?: "button" | "submit"; onClick?: () => void };

export function Button({ children, href, variant = "dark", type = "button", onClick }: ButtonProps) {
  const className = `button button-${variant}`;
  return href ? <a className={className} href={href}>{children}</a> : <button className={className} type={type} onClick={onClick}>{children}</button>;
}
