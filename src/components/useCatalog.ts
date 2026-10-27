"use client";

import { useCallback, useEffect, useState } from "react";
import { toStoreProduct, type Product } from "@/lib/products";

export type CatalogCategory = { id: string; name: string; slug: string; image?: string; description?: string };
export type CatalogCollection = { id: string; name: string; slug: string; image?: string; description?: string };
export type CatalogData = {
  products: Product[];
  categories: CatalogCategory[];
  collections: CatalogCollection[];
  productError: boolean;
  categoryError: boolean;
  collectionError: boolean;
};

type Status = "loading" | "ready" | "error";

let inflight: Promise<CatalogData> | null = null;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} failed`);
  return (await response.json()) as T;
}

// Concurrent callers (several homepage sections) share one network round trip; nothing is cached afterwards
// so stock is always as fresh as the last page view.
function load(): Promise<CatalogData> {
  if (!inflight) {
    inflight = (async () => {
      const [productsResult, categoriesResult, collectionsResult] = await Promise.allSettled([
        getJson<Array<Record<string, unknown>>>("/api/products"),
        getJson<Array<{ id: string; name: string; slug: string; image?: string; description?: string; active?: boolean }>>("/api/categories"),
        getJson<Array<{ id: string; name: string; slug: string; image?: string; description?: string; active?: boolean }>>("/api/collections"),
      ]);
      const productError = productsResult.status === "rejected";
      const categoryError = categoriesResult.status === "rejected";
      const collectionError = collectionsResult.status === "rejected";
      const rawProducts = productsResult.status === "fulfilled" ? productsResult.value : [];
      const rawCategories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
      const rawCollections = collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
      const categories = rawCategories.filter((category) => category.active !== false);
      const lookup = new Map(rawCategories.map((category) => [category.id, { name: category.name, slug: category.slug }]));
      return {
        products: rawProducts
          .filter((item) => item.active !== false && item.status !== "inactive" && item.status !== "draft")
          .map((item) => toStoreProduct(item, lookup)),
        categories: categories.map(({ id, name, slug, image, description }) => ({ id, name, slug, image, description })),
        collections: rawCollections.filter((item) => item.active !== false).map(({ id, name, slug, image, description }) => ({ id, name, slug, image, description })),
        productError,
        categoryError,
        collectionError,
      };
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function useCatalog() {
  const [data, setData] = useState<CatalogData>({
    products: [],
    categories: [],
    collections: [],
    productError: false,
    categoryError: false,
    collectionError: false,
  });
  const [status, setStatus] = useState<Status>("loading");

  const reload = useCallback(() => {
    setStatus("loading");
    load()
      .then((result) => {
        setData(result);
        setStatus(result.productError || result.categoryError ? "error" : "ready");
      })
      .catch(() => {
        setData({
          products: [],
          categories: [],
          collections: [],
          productError: true,
          categoryError: true,
          collectionError: true,
        });
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    reload();
  }, [reload]);

  return {
    ...data,
    status,
    categoryStatus: status === "loading" ? "loading" : data.categoryError ? "error" : "ready",
    collectionStatus: status === "loading" ? "loading" : data.collectionError ? "error" : "ready",
    reload,
  };
}
