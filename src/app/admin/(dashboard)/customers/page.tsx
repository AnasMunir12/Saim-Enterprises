"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CustomerPanel } from "@/components/admin/customers/CustomerPanel";
import { Alert, Badge, EmptyState, PageHeader, Pagination, Spinner, cardCls, inputCls, smallBtn, useDebounced } from "@/components/admin/ui";
import { useNotice } from "@/components/admin/useAdminResource";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate, formatPKR } from "@/lib/format";

type Customer = { id: string; name: string; email: string; avatar?: string; createdAt: string; orderCount: number; totalSpent: number; status: "active" | "suspended"; hasPassword: boolean; hasGoogle: boolean };
const methodLabel = (customer: Customer) => (customer.hasGoogle && customer.hasPassword ? "Password + Google" : customer.hasGoogle ? "Google" : "Password");
type CustomersResponse = { customers: Customer[]; total: number; page: number; pages: number };

export default function CustomersPage() {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const { notice, clear, success } = useNotice();
  const q = useDebounced(search.trim(), 300);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      setData(await adminFetch<CustomersResponse>(`/api/admin/customers?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="Customers" description={data ? `${data.total} registered customer${data.total === 1 ? "" : "s"}. Open a customer to see their orders, suspend or reactivate the account, or delete it.` : "Registered shoppers. Open a customer to manage the account."} />

      {notice ? <Alert tone={notice.tone} onDismiss={clear}>{notice.text}</Alert> : null}

      <div className={cardCls}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email" aria-label="Search customers" className={`${inputCls} pl-9`} />
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter by account status">
            {(["all", "active", "suspended"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${status === value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"}`}>{value}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading customers" />
        ) : error ? (
          <div className="mt-4"><Alert onRetry={() => { setLoading(true); void load(); }}>{error}</Alert></div>
        ) : !data || data.customers.length === 0 ? (
          <EmptyState title={q || status !== "all" ? "No customers match" : "No customers yet"} text={q || status !== "all" ? undefined : "Shoppers who create an account will be listed here."} />
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Signed up</th>
                    <th className="pb-3 pr-4 font-medium">Sign-in</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 text-right font-medium">Orders</th>
                    <th className="pb-3 pr-4 text-right font-medium">Total spent</th>
                    <th className="pb-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-stone-100">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-700" aria-hidden="true">{customer.name.charAt(0).toUpperCase()}</div>
                          <div><div className="font-medium">{customer.name}</div><div className="text-xs text-stone-500">{customer.email}</div></div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{formatDate(customer.createdAt)}</td>
                      <td className="py-3 pr-4 text-stone-600">{methodLabel(customer)}</td>
                      <td className="py-3 pr-4"><Badge tone={customer.status === "suspended" ? "red" : "green"}>{customer.status === "suspended" ? "Suspended" : "Active"}</Badge></td>
                      <td className="py-3 pr-4 text-right">{customer.orderCount}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right">{formatPKR(customer.totalSpent)}</td>
                      <td className="py-3 text-right"><button type="button" className={smallBtn} onClick={() => setOpenId(customer.id)} aria-label={`Open ${customer.name}`}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 md:hidden">
              {data.customers.map((customer) => (
                <li key={customer.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">{customer.name}</span><Badge tone={customer.status === "suspended" ? "red" : "green"}>{customer.status === "suspended" ? "Suspended" : "Active"}</Badge></div>
                  <div className="break-all text-xs text-stone-500">{customer.email}</div>
                  <div className="mt-2 flex justify-between text-xs text-stone-600">
                    <span>Joined {formatDate(customer.createdAt)}</span>
                    <span>{customer.orderCount} order{customer.orderCount === 1 ? "" : "s"} · {formatPKR(customer.totalSpent)}</span>
                  </div>
                  <button type="button" className={`${smallBtn} mt-3`} onClick={() => setOpenId(customer.id)} aria-label={`Open ${customer.name}`}>Open</button>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>

      <CustomerPanel customerId={openId} onClose={() => setOpenId(null)} onChanged={(message) => { success(message); void load(); }} />
    </div>
  );
}
