import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdminUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/login");
  }

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}
