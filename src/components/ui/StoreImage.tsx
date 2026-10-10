"use client";

import { useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { src?: string | null; alt: string; eager?: boolean };

// A plain <img> on purpose: product images come from admin uploads and arbitrary hosts, none of which are
// registered in next.config, so next/image would reject them. This adds lazy loading, async decoding and a
// graceful placeholder when a picture is missing or fails to load.
export function StoreImage({ src, alt, eager, className, ...rest }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`img-fallback ${className ?? ""}`} role="img" aria-label={alt}>
        <span aria-hidden="true">{alt.trim().charAt(0).toUpperCase() || "S"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}
