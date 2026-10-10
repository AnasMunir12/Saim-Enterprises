"use client";

import { useState, type FormEvent } from "react";
import { InspirationGallery } from "@/components/home/InspirationGallery";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { HoneypotField, TextField } from "@/components/ui/FormField";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; message: string } | { kind: "error"; message: string };

// Inspiration gallery followed by the email sign-up.
export function NewsletterSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: trap, source: "home" }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setState({ kind: "error", message: data.message ?? "Something went wrong. Please try again." });
        return;
      }
      setEmail("");
      setState({ kind: "done", message: data.message ?? "Thank you. You are on the list." });
    } catch {
      setState({ kind: "error", message: "Unable to reach the server. Please try again." });
    }
  }

  return (
    <>
      <InspirationGallery copy={copy} />

      <section className="newsletter" aria-labelledby="newsletter-heading">
        <div>
          <p className="eyebrow">Stay a while</p>
          <h2 id="newsletter-heading">{copy.title || <>Bring your idea to <em>life.</em></>}</h2>
          <p className="newsletter__lead">New releases, studio notes and custom project updates, sent now and then.</p>
        </div>

        <form className="newsletter__form" onSubmit={subscribe}>
          <TextField label="Email address" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required maxLength={254} />
          <HoneypotField value={trap} onChange={setTrap} />
          <Button type="submit" size="lg" block loading={state.kind === "sending"}>Subscribe</Button>
          <p className="newsletter__note">No spam. Unsubscribe whenever you like.</p>
          {state.kind === "done" ? <Alert tone="success">{state.message}</Alert> : null}
          {state.kind === "error" ? <Alert tone="error">{state.message}</Alert> : null}
        </form>
      </section>
    </>
  );
}
