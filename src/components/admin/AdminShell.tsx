"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MESSAGES_CHANGED } from "@/lib/contact-message";
import { BadgeCheck, Boxes, CircleHelp, ExternalLink, FileText, LayoutDashboard, LayoutList, LogOut, Mail, Menu, MessageSquareQuote, Package, Settings, ShoppingBag, Sparkles, Tags, Users, X } from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Package; children?: Array<{ href: string; label: string; icon: typeof Package }> };

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/queries", label: "Customer Queries", icon: Mail },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/collections", label: "Collections", icon: Boxes },
  {
    href: "/admin/content",
    label: "Content",
    icon: FileText,
    children: [
      { href: "/admin/content/homepage", label: "Homepage", icon: FileText },
      { href: "/admin/content/hero", label: "Hero slides", icon: Sparkles },
    ],
  },
  {
    href: "/admin/site-content",
    label: "Site content",
    icon: LayoutList,
    children: [
      { href: "/admin/site-content/trust-strip", label: "Trust strip", icon: BadgeCheck },
      { href: "/admin/site-content/faq", label: "FAQ", icon: CircleHelp },
      { href: "/admin/site-content/pages", label: "Pages", icon: FileText },
    ],
  },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const titles: Array<[string, string]> = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/products", "Products & Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/queries", "Customer Queries"],
  ["/admin/categories", "Categories"],
  ["/admin/collections", "Collections"],
  ["/admin/content/homepage", "Homepage content"],
  ["/admin/content/hero", "Hero slides"],
  ["/admin/site-content/trust-strip", "Trust strip"],
  ["/admin/site-content/faq", "FAQ"],
  ["/admin/site-content/pages", "Information pages"],
  ["/admin/testimonials", "Testimonials"],
  ["/admin/settings", "Settings"],
];

const linkCls = (active: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    active ? "!bg-stone-900 !text-white" : "!text-stone-500 hover:!bg-stone-100 hover:!text-stone-800"
  }`;

export function AdminShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unread, setUnread] = useState(0);

  const title = titles.find(([href]) => pathname === href || pathname.startsWith(href + "/"))?.[1] ?? "Admin";

  // Close the mobile drawer on navigation and with Escape.
  useEffect(() => {
    const timer = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Unread customer queries (contact-form messages) for the nav badge: refreshed on navigation, every minute, and when the inbox changes.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/admin/queries?status=new&limit=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (!cancelled) setUnread(data.unread ?? 0);
      } catch {
        // the badge is a convenience; stay quiet when offline
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    window.addEventListener(MESSAGES_CHANGED, refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(MESSAGES_CHANGED, refresh);
    };
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {navItems.map(({ href, label, icon: Icon, children: sub }) => {
        if (sub) {
          const groupActive = pathname.startsWith(href + "/");
          return (
            <div key={href} className="mt-1">
              <div className={`flex items-center gap-3 px-3 py-2 text-sm font-medium ${groupActive ? "text-stone-900" : "text-stone-500"}`}>
                <Icon size={16} />
                {label}
              </div>
              <div className="ml-6 space-y-1 border-l border-stone-200 pl-3">
                {sub.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={linkCls(active)}>
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={linkCls(active)}>
            <Icon size={16} />
            {label}
            {href === "/admin/queries" && unread > 0 ? (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-white text-stone-900" : "bg-amber-500 text-white"}`} aria-label={`${unread} unread queries`}>{unread > 99 ? "99+" : unread}</span>
            ) : null}
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-stone-200 pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium !text-stone-500 transition hover:!bg-stone-100 hover:!text-stone-800">
          <ExternalLink size={16} />
          View storefront
        </a>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-60"
        >
          <LogOut size={16} />
          {loggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </nav>
  );

  const brand = (
    <div className="border-b border-stone-200 p-5">
      <div className="text-lg font-semibold tracking-tight">Saim Admin</div>
      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">Back office</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-stone-200 bg-white lg:flex">
        {brand}
        {nav}
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <div className="absolute inset-0 bg-stone-900/40" aria-hidden="true" />
          <aside id="admin-drawer" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><X size={18} /></button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 lg:px-8 lg:py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="admin-drawer" className="rounded-lg border border-stone-200 p-2 text-stone-700 lg:hidden">
              <Menu size={18} />
            </button>
            <div>
              <p className="hidden text-xs uppercase tracking-[0.2em] text-stone-500 sm:block">Workspace</p>
              <h1 className="text-xl font-semibold tracking-tight sm:mt-1 sm:text-2xl">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-medium text-white" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[11px] text-stone-500">{user.email}</div>
            </div>
          </div>
        </header>

        <main id="admin-main" className="min-w-0 p-4 sm:p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
