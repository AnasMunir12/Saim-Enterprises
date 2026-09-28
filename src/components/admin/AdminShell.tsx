"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Tags, Boxes, FileText, Settings, LogOut, Sparkles } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/collections", label: "Collections", icon: Boxes },
  { href: "/admin/content/homepage", label: "Homepage", icon: FileText },
  { href: "/admin/content/hero", label: "Hero", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-stone-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-stone-200 p-5">
            <div className="text-lg font-semibold tracking-tight">Saim Admin</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">CMS</div>
          </div>

          <nav className="space-y-1 p-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                 className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
  active
    ? "!bg-stone-900 !text-white"
    : "!text-stone-500 hover:!bg-stone-100 hover:!text-stone-800"
}`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-[11px] text-stone-500">{user.email}</div>
              </div>
            </div>
          </header>

          <main className="p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
