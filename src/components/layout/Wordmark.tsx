import Link from "next/link";
import type { CSSProperties } from "react";
import { useStore } from "@/components/StoreProvider";

type LogoStyle = CSSProperties & {
  "--logo-mobile-width": string;
  "--logo-desktop-width": string;
  "--logo-max-height": string;
  "--logo-object-fit": "contain" | "cover";
};

export function Wordmark({ className = "" }: { className?: string }) {
  const { settings } = useStore();
  const imageStyle: LogoStyle = {
    "--logo-mobile-width": `${settings?.logoMobileWidth ?? 160}px`,
    "--logo-desktop-width": `${settings?.logoDesktopWidth ?? 220}px`,
    "--logo-max-height": `${settings?.logoMaxHeight ?? 48}px`,
    "--logo-object-fit": settings?.logoObjectFit ?? "contain",
  };

  return (
    <Link className={`wordmark${settings?.logo ? " wordmark--image" : ""} ${className}`.trim()} href="/" aria-label="Saim Enterprises home page">
      {settings?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- Logo URLs are stored from the secured Cloudinary upload service.
        <img className="wordmark-logo" src={settings.logo} alt={settings.websiteName || "Saim Enterprises"} style={imageStyle} />
      ) : (
        <>saim <i>enterprises</i></>
      )}
    </Link>
  );
}
