"use client";

import { Archive, ArchiveRestore, CheckCheck, Mail, MailOpen, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, ConfirmDialog, EmptyState, Field, PageHeader, Pagination, SidePanel, Spinner, cardCls, inputCls, smallBtn, smallDangerBtn, primaryBtn, useDebounced } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { MESSAGES_CHANGED, MESSAGE_STATUSES, MESSAGE_STATUS_LABELS, MESSAGE_STATUS_TONES, type MessageStatus } from "@/lib/contact-message";
import { formatDate } from "@/lib/format";
import { customerWhatsappNumber, whatsappLink } from "@/lib/whatsapp";

type Row = { id: string; name: string; email: string; phone?: string; subject?: string; preview: string; status: MessageStatus; createdAt: string };
type Detail = { id: string; name: string; email: string; phone?: string; subject?: string; message: string; status: MessageStatus; adminNote?: string; userId?: string; createdAt: string };
type ListResponse = { messages: Row[]; total: number; page: number; pages: number; counts: Record<string, number>; unread: number };

const notifyChanged = () => window.dispatchEvent(new Event(MESSAGES_CHANGED));

export default function CustomerQueriesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [status, setStatus] = useState<"all" | MessageStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [initialised, setInitialised] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const openRequest = useRef(0);

  const q = useDebounced(search.trim(), 300);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initial = new URLSearchParams(window.location.search).get("status");
      if (initial && (MESSAGE_STATUSES as readonly string[]).includes(initial)) setStatus(initial as MessageStatus);
      setInitialised(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      setData(await adminFetch<ListResponse>(`/api/admin/queries?${params}`, { cache: "no-store" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customer queries.");
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    if (!initialised) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, initialised]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function patch(id: string, body: { status?: MessageStatus; adminNote?: string }) {
    const updated = await adminFetch<Detail>(`/api/admin/queries/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setDetail((current) => (current && current.id === id ? { ...current, ...updated } : current));
    notifyChanged();
    await load();
    return updated;
  }

  // Opening a query shows it in full and marks it read.
  async function open(row: Row) {
    const request = ++openRequest.current;
    setOpenId(row.id);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const full = await adminFetch<Detail>(`/api/admin/queries/${row.id}`, { cache: "no-store" });
      if (request !== openRequest.current) return;
      setDetail(full);
      setNote(full.adminNote ?? "");
      if (full.status === "new") {
        try {
          await patch(full.id, { status: "read" });
        } catch {
          // Reading still works; the badge will correct itself on the next refresh.
        }
      }
    } catch (err) {
      if (request === openRequest.current) setDetailError(err instanceof Error ? err.message : "Unable to load the query.");
    } finally {
      if (request === openRequest.current) setDetailLoading(false);
    }
  }

  function close() {
    openRequest.current++;
    setOpenId(null);
    setDetail(null);
    setConfirmDelete(false);
  }

  async function changeStatus(next: MessageStatus, text: string) {
    if (!detail) return;
    setWorking(true);
    try {
      await patch(detail.id, { status: next });
      setNotice({ tone: "success", text });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Could not update the query." });
    } finally {
      setWorking(false);
    }
  }

  async function saveNote() {
    if (!detail) return;
    setWorking(true);
    try {
      await patch(detail.id, { adminNote: note });
      setNotice({ tone: "success", text: "Note saved." });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Could not save the note." });
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!detail) return;
    setWorking(true);
    try {
      await adminFetch(`/api/admin/queries/${detail.id}`, { method: "DELETE" });
      setNotice({ tone: "success", text: `Query from ${detail.name} deleted.` });
      close();
      notifyChanged();
      await load();
    } catch (err) {
      setConfirmDelete(false);
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Could not delete the query." });
    } finally {
      setWorking(false);
    }
  }

  const counts = data?.counts ?? {};
  const allCount = MESSAGE_STATUSES.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  const tabs: Array<{ key: "all" | MessageStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: allCount },
    ...MESSAGE_STATUSES.map((key) => ({ key, label: MESSAGE_STATUS_LABELS[key], count: counts[key] ?? 0 })),
  ];
  const filtered = status !== "all" || q !== "";

  const replySubject = detail ? `Re: ${detail.subject || "your message to Saim Enterprises"}` : "";
  const replyBody = detail ? `Hi ${detail.name},\n\n\n\n---\nOn ${formatDate(detail.createdAt)} you wrote:\n${detail.message}` : "";
  const waNumber = customerWhatsappNumber(detail?.phone);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Customer Queries"
        description="Questions sent from the contact form on your website. Reply to each one by email."
        actions={data ? <Badge tone={data.unread > 0 ? "amber" : "stone"}>{data.unread} unread</Badge> : null}
      />

      {notice ? <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className={cardCls}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter queries by status">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={status === tab.key}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${status === tab.key ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"}`}
              >
                {tab.label} <span className="opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email, phone, message" aria-label="Search queries" className={`${inputCls} pl-9`} />
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading customer queries" />
        ) : error ? (
          <div className="mt-4"><Alert onRetry={() => { setLoading(true); void load(); }}>{error}</Alert></div>
        ) : !data || data.messages.length === 0 ? (
          <EmptyState
            title={filtered ? "No queries match" : "No customer queries yet"}
            text={filtered ? "Try another status or search term." : "When a visitor sends the contact form, their question will appear here with their email and phone."}
          />
        ) : (
          <>
            <ul className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200" aria-label="Customer queries">
              {data.messages.map((row) => {
                const unread = row.status === "new";
                return (
                  <li key={row.id}>
                    <button type="button" onClick={() => void open(row)} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${unread ? "bg-amber-50/60" : "bg-white"}`}>
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-amber-500" : "bg-transparent"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className={`truncate text-sm ${unread ? "font-semibold" : "font-medium"}`}>{row.name}{unread ? <span className="sr-only"> (unread)</span> : null}</span>
                          <span className="shrink-0 text-xs text-stone-500">{formatDate(row.createdAt, true)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-stone-500">{row.email}{row.phone ? ` · ${row.phone}` : ""}</span>
                        <span className={`mt-0.5 block truncate text-sm ${unread ? "text-stone-900" : "text-stone-700"}`}>{row.subject || "No subject"}</span>
                        <span className="mt-0.5 block truncate text-xs text-stone-500">{row.preview}</span>
                      </span>
                      <span className="hidden shrink-0 sm:block"><Badge tone={MESSAGE_STATUS_TONES[row.status]}>{MESSAGE_STATUS_LABELS[row.status]}</Badge></span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>

      <SidePanel open={openId !== null} title={detail ? `Query from ${detail.name}` : "Customer query"} onClose={close}>
        {detailLoading && !detail ? <Spinner label="Loading query" /> : null}
        {detailError ? <Alert onRetry={() => { const row = data?.messages.find((item) => item.id === openId); if (row) void open(row); }}>{detailError}</Alert> : null}
        {detail ? (
          <div className="space-y-6 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={MESSAGE_STATUS_TONES[detail.status]}>{MESSAGE_STATUS_LABELS[detail.status]}</Badge>
              <span className="text-xs text-stone-500">Received {formatDate(detail.createdAt, true)}</span>
            </div>

            <section className="rounded-xl border border-stone-200 bg-stone-50 p-4" aria-label="Sender">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">From</h4>
              <div className="text-base font-semibold">{detail.name}</div>
              <div className="mt-2 flex items-center gap-2 break-all text-base"><Mail size={16} className="shrink-0 text-stone-500" aria-hidden="true" /><a className="font-medium underline" href={`mailto:${detail.email}`}>{detail.email}</a></div>
              {detail.phone ? <div className="mt-1 flex items-center gap-2 text-base"><Phone size={16} className="shrink-0 text-stone-500" aria-hidden="true" /><a className="font-medium underline" href={`tel:${detail.phone.replace(/\s+/g, "")}`}>{detail.phone}</a></div> : <div className="mt-1 text-xs text-stone-400">No phone number given</div>}
              {detail.userId ? <div className="mt-2 text-xs text-stone-400">Signed-in customer</div> : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <a className={primaryBtn} href={`mailto:${detail.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`}><Mail size={16} /> Reply by email</a>
                {waNumber ? (
                  <a className={smallBtn} href={whatsappLink(waNumber, `Hi ${detail.name}, this is Saim Enterprises replying to your message${detail.subject ? ` about "${detail.subject}"` : ""}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={12} /> Also on WhatsApp</a>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-stone-500">Opens your email app with the reply started. Afterwards, tap Mark replied below.</p>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Subject</h4>
              <p className="break-words font-medium">{detail.subject || "No subject"}</p>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Their question</h4>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-4 leading-relaxed text-stone-800">{detail.message}</p>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">Status</h4>
              <div className="flex flex-wrap gap-2">
                {detail.status !== "replied" ? <button type="button" className={smallBtn} disabled={working} onClick={() => void changeStatus("replied", "Marked as replied.")}><CheckCheck size={12} /> Mark replied</button> : null}
                {detail.status !== "read" ? <button type="button" className={smallBtn} disabled={working} onClick={() => void changeStatus("read", "Marked as read.")}><MailOpen size={12} /> Mark read</button> : null}
                {detail.status !== "new" ? <button type="button" className={smallBtn} disabled={working} onClick={() => void changeStatus("new", "Marked as unread.")}><Mail size={12} /> Mark unread</button> : null}
                {detail.status !== "archived" ? (
                  <button type="button" className={smallBtn} disabled={working} onClick={() => void changeStatus("archived", "Query archived.")}><Archive size={12} /> Archive</button>
                ) : (
                  <button type="button" className={smallBtn} disabled={working} onClick={() => void changeStatus("read", "Query restored to the inbox.")}><ArchiveRestore size={12} /> Restore</button>
                )}
              </div>
            </section>

            <section>
              <Field label="Private note" htmlFor="msg-note" hint="Only you can see this. It is never sent to the customer.">
                <textarea id="msg-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} className={inputCls} />
              </Field>
              <button type="button" className={`${smallBtn} mt-2`} disabled={working || note.trim() === (detail.adminNote ?? "")} onClick={() => void saveNote()}>Save note</button>
            </section>

            <section className="border-t border-stone-200 pt-4">
              <button type="button" className={smallDangerBtn} disabled={working} onClick={() => setConfirmDelete(true)}><Trash2 size={12} /> Delete query</button>
            </section>
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmDelete}
        busy={working}
        destructive
        title="Delete this query?"
        message="The query is removed permanently. If you only want it out of the way, archive it instead."
        confirmLabel="Delete query"
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
