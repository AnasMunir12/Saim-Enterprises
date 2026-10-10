import type { UserRole } from "@/models/User";

// Matches lib/auth normalizeRole: anything other than an explicit "admin" is a customer.
export function resolveRole(role: string | undefined | null): UserRole {
  return role === "admin" ? "admin" : "customer";
}

export function postLoginPath(role: UserRole) {
  return role === "admin" ? "/admin/dashboard" : "/account";
}

/** Query flag that tells the storefront to reopen the bag at the checkout step after signing in. */
export const CHECKOUT_PARAM = "checkout";

/** Only same-site absolute paths are accepted as a post-login destination (no "//host", no schemes). */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || value.length > 500 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

/** Adds `?checkout=1` to a path while keeping its existing query string and hash. */
export function withCheckoutIntent(path: string): string {
  const [beforeHash, hash = ""] = path.split("#");
  const [pathname, query = ""] = beforeHash.split("?");
  const params = new URLSearchParams(query);
  params.set(CHECKOUT_PARAM, "1");
  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

/** /login or /signup link that returns the shopper to `next` afterwards. */
export function authHref(page: "login" | "signup", next: string): string {
  return `/${page}?next=${encodeURIComponent(next)}`;
}
