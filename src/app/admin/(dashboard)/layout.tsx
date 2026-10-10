import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Defence in depth: the edge proxy already blocks non-admins, this re-checks against the database.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login?expired=1");
  }

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}
