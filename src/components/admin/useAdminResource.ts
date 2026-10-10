"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

/**
 * Loads a list from `endpoint` and offers create / update / remove / reorder against the REST routes next to it
 * (`POST endpoint`, `PUT|DELETE endpoint/:id`, `POST endpoint/reorder`). Every mutation reloads the list so the screen
 * always shows what the server stored. Mutations throw on failure with a readable message for the caller to display.
 */
export function useAdminResource<T extends { id: string }>(endpoint: string, options: { listEndpoint?: string } = {}) {
  const listUrl = options.listEndpoint ?? endpoint;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setItems(await adminFetch<T[]>(listUrl, { cache: "no-store" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the list.");
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const create = useCallback(async (body: Record<string, unknown>) => {
    const created = await adminFetch<T>(endpoint, { method: "POST", body: JSON.stringify(body) });
    await reload();
    return created;
  }, [endpoint, reload]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    const updated = await adminFetch<T>(`${endpoint}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
    await reload();
    return updated;
  }, [endpoint, reload]);

  const remove = useCallback(async (id: string) => {
    await adminFetch(`${endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await reload();
  }, [endpoint, reload]);

  const reorder = useCallback(async (ids: string[]) => {
    await adminFetch(`${endpoint}/reorder`, { method: "POST", body: JSON.stringify({ ids }) });
    await reload();
  }, [endpoint, reload]);

  return { items, setItems, loading, error, reload, create, update, remove, reorder };
}

export type Notice = { tone: "success" | "error"; text: string };

/** A dismissible success / error message that clears itself after a few seconds. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return {
    notice,
    clear: () => setNotice(null),
    success: (text: string) => setNotice({ tone: "success", text }),
    fail: (error: unknown, fallback: string) => setNotice({ tone: "error", text: error instanceof Error ? error.message : fallback }),
  };
}
