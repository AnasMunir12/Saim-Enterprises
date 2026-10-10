import type { Metadata } from "next";
import { Suspense } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { TrackView } from "@/components/track/TrackView";
import { PageHero } from "@/components/ui/PageHero";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Track your order | Saim Enterprises",
  description: "Sign in to see the status of your Saim Enterprises orders.",
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <PageChrome>
      <PageHero eyebrow="Order tracking" title={<>Where is <em>my order?</em></>} lead="Every order you place with your account appears here, from pending to delivered." />
      <Suspense fallback={<section className="track"><Skeleton style={{ height: 260 }} /></section>}>
        <TrackView />
      </Suspense>
    </PageChrome>
  );
}
