"use client";

import { useEffect, useState } from "react";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/catalog/CategoryGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CatalogCategory } from "@/components/useCatalog";

type LoadState =
  | { status: "loading"; categories: CatalogCategory[] }
  | { status: "ready"; categories: CatalogCategory[] }
  | { status: "error"; categories: CatalogCategory[]; message: string };

function parseCategories(value: unknown): CatalogCategory[] {
  if (!Array.isArray(value)) throw new Error("The category list is unavailable.");
  return value.flatMap((entry): CatalogCategory[] => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("The category list contains invalid data.");
    const category = entry as Record<string, unknown>;
    if (typeof category.id !== "string" || typeof category.name !== "string" || typeof category.slug !== "string") {
      throw new Error("The category list contains invalid data.");
    }
    if (category.active !== undefined && typeof category.active !== "boolean") throw new Error("The category list contains invalid data.");
    if (category.active === false) return [];
    return [{
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: typeof category.image === "string" ? category.image : undefined,
      description: typeof category.description === "string" ? category.description : undefined,
    }];
  });
}

export function AllCategoriesContent() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading", categories: [] });

  useEffect(() => {
    let current = true;
    fetch("/api/categories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load categories.");
        return parseCategories(await response.json());
      })
      .then((categories) => {
        if (current) setState({ status: "ready", categories });
      })
      .catch((cause: unknown) => {
        if (current) setState({
          status: "error",
          categories: [],
          message: cause instanceof Error ? cause.message : "Could not load the category list.",
        });
      });
    return () => {
      current = false;
    };
  }, [attempt]);

  if (state.status === "loading") return <CategoryGridSkeleton count={8} />;
  if (state.status === "error") {
    return <EmptyState role="alert" title="We could not load categories just now." actions={<Button onClick={() => {
      setState({ status: "loading", categories: [] });
      setAttempt((value) => value + 1);
    }}>Try again</Button>}>{state.message}</EmptyState>;
  }
  if (state.categories.length === 0) return <EmptyState title="No categories are available right now." />;
  return <CategoryGrid categories={state.categories} />;
}
