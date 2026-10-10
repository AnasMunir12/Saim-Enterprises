"use client";

import { Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";

// Native share sheet where the browser has one, otherwise copies the page address.
export function ShareButton({ title }: { title: string }) {
  const { notify } = useStore();
  const [pageUrl, setPageUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values, set after hydration
    setPageUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);

  async function share() {
    try {
      if (canShare) {
        await navigator.share({ title, text: `${title} by Saim Enterprises`, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      notify("Link copied to clipboard.");
    } catch (error) {
      // Dismissing the native share sheet is not an error worth reporting.
      if (!(error instanceof DOMException && error.name === "AbortError")) notify("Could not share. Copy the address from your browser instead.");
    }
  }

  return (
    <button type="button" onClick={share}>
      {canShare ? <Share2 size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />} {canShare ? "Share" : "Copy link"}
    </button>
  );
}
