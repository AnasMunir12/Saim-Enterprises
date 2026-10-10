import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { getActiveListItems } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "FAQs | Saim Enterprises",
  description: "Answers about ordering, delivery, custom pieces and returns at Saim Enterprises.",
};

// The questions are edited in the admin dashboard (Site content > FAQ), so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await getActiveListItems("faq");

  return (
    <PolicyPage eyebrow="Help" title={<>Questions,<br /><em>answered.</em></>} intro="The things people ask us most. If yours is not here, just message us.">
      {faqs.length ? (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
            }}
          />
          <div className="faq-list">
            {faqs.map((item, index) => (
              <details key={index}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </>
      ) : null}
    </PolicyPage>
  );
}
