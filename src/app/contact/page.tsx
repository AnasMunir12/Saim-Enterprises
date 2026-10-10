import type { Metadata } from "next";
import { ContactView } from "@/components/contact/ContactView";
import { PageChrome } from "@/components/layout/PageChrome";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Contact | Saim Enterprises",
  description: "Send the Saim Enterprises studio in Lahore a question about custom laser-cut, CNC, engraving and décor pieces. We reply by email.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ subject?: string | string[] }> }) {
  const { subject } = await searchParams;
  const initialSubject = (Array.isArray(subject) ? subject[0] : subject)?.slice(0, 150) ?? "";

  return (
    <PageChrome>
      <PageHero eyebrow="Come say hello" title={<>Let&apos;s make <em>something meaningful.</em></>} lead="Questions about a piece, a custom idea or an order? Send us a note and we will reply by email." />
      <ContactView initialSubject={initialSubject} />
    </PageChrome>
  );
}
