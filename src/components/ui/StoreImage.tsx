"use client";

import { useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { src?: string | null; alt: string; eager?: boolean };

function cloudinarySrcAtWidth(src: string, width: number) {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const uploadPath = "/image/upload/";
    const uploadIndex = url.pathname.indexOf(uploadPath);
    if (uploadIndex < 0) return null;

    const prefix = url.pathname.slice(0, uploadIndex + uploadPath.length);
    const remainder = url.pathname.slice(prefix.length);
    const slashIndex = remainder.indexOf("/");
    const firstSegment = slashIndex < 0 ? remainder : remainder.slice(0, slashIndex);
    const hasTransform = /(?:^|,)(?:c_|w_|h_|f_|q_)/.test(firstSegment);
    const path = `${prefix}${hasTransform ? "" : `c_limit,w_${width},f_auto,q_auto/`}${hasTransform ? remainder.replace(firstSegment, `c_limit,w_${width},f_auto,q_auto`) : remainder}`;
    url.pathname = path;
    return url.toString();
  } catch {
    return null;
  }
}

function cloudinarySrcSet(src: string) {
  const widths = [480, 768, 1200, 1600];
  const candidates = widths.map((width) => {
    const url = cloudinarySrcAtWidth(src, width);
    return url ? `${url} ${width}w` : null;
  });
  return candidates.every(Boolean) ? candidates.join(", ") : undefined;
}

export function StoreImage({ src, alt, eager, className, ...rest }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const srcSet = src ? cloudinarySrcSet(src) : undefined;
  const optimizedSrc = src && srcSet ? cloudinarySrcAtWidth(src, 1200) ?? src : src;

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
      src={optimizedSrc ?? undefined}
      srcSet={srcSet}
      sizes={srcSet ? rest.sizes ?? "(min-width: 900px) 33vw, 50vw" : rest.sizes}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      data-image-loading={loadedSrc !== src ? "true" : undefined}
      onLoad={(event) => {
        setLoadedSrc(src);
        rest.onLoad?.(event);
      }}
      onError={(event) => {
        setFailedSrc(src);
        rest.onError?.(event);
      }}
    />
  );
}
