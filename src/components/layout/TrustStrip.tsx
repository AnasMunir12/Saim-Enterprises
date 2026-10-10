import { Clock, Heart, PackageCheck, RefreshCcw, Ruler, ShieldCheck, Sparkles, Truck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { TrustIcon, TrustItem } from "@/lib/content-lists";

const ICONS: Record<TrustIcon, LucideIcon> = {
  truck: Truck,
  returns: RefreshCcw,
  package: PackageCheck,
  ruler: Ruler,
  shield: ShieldCheck,
  heart: Heart,
  sparkles: Sparkles,
  clock: Clock,
};

// Reassurance points under the banner. The owner edits them in the dashboard (Site content > Trust strip).
export function TrustStrip({ items }: { items: TrustItem[] }) {
  if (!items.length) return null;
  return (
    <section className="trust-strip" aria-label="Why shop with us">
      <ul style={{ "--cols": items.length } as CSSProperties}>
        {items.map(({ icon, title, text, link }, index) => {
          const Icon = ICONS[icon] ?? Truck;
          const content = (
            <>
              <Icon size={24} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>{title}</strong>{text ? <small>{text}</small> : null}</span>
            </>
          );
          return <li key={index}>{link ? <Link href={link}>{content}</Link> : <div className="trust-strip__item">{content}</div>}</li>;
        })}
      </ul>
    </section>
  );
}
