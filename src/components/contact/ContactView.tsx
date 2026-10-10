"use client";

import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/components/StoreProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { HoneypotField, TextArea, TextField } from "@/components/ui/FormField";
import { BUSINESS_EMAIL, BUSINESS_PHONE } from "@/lib/constants";

type Form = { name: string; email: string; phone: string; subject: string; message: string; website: string };

// A plain query form: the message is saved to the studio inbox and answered by email.
export function ContactView({ initialSubject = "" }: { initialSubject?: string }) {
  const { settings, user } = useStore();
  const empty: Form = { name: "", email: "", phone: "", subject: initialSubject, message: "", website: "" };
  const [form, setForm] = useState<Form>(empty);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const prefilled = useRef(false);
  const phone = settings?.phone || BUSINESS_PHONE;
  const email = settings?.contactEmail || BUSINESS_EMAIL;

  // A signed-in customer does not have to retype their name and email.
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    setForm((current) => ({ ...current, name: current.name || user.name, email: current.email || user.email }));
  }, [user]);

  const set = (key: keyof Form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "We could not send your message. Please try again, or email us directly.");
        setState("idle");
        return;
      }
      setSentTo(form.email);
      setForm((current) => ({ ...empty, subject: "", name: user ? current.name : "", email: user ? current.email : "" }));
      setState("sent");
    } catch {
      setError("Unable to reach the server. Check your connection and try again, or email us directly.");
      setState("idle");
    }
  }

  return (
    <section className="info">
      <div>
        <p className="eyebrow">The studio</p>
        <h2>Have an idea? We&apos;d love to hear it.</h2>
        <p>For questions about a piece, custom laser-cut, CNC, engraving and décor work, or an order, send us a note. We read every message and reply by email.</p>
        <ul className="contact-details">
          <li><Mail size={18} aria-hidden="true" /> <a href={`mailto:${email}`}>{email}</a></li>
          <li><Phone size={18} aria-hidden="true" /> <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></li>
          {settings?.address ? <li><MapPin size={18} aria-hidden="true" /> <span className="contact-multiline">{settings.address}</span></li> : null}
          {settings?.openingHours ? <li><Clock size={18} aria-hidden="true" /> <span className="contact-multiline">{settings.openingHours}</span></li> : null}
        </ul>
      </div>

      {state === "sent" ? (
        <div className="contact-card contact-success" role="status">
          <CheckCircle2 size={36} aria-hidden="true" />
          <h3>Message sent. Thank you.</h3>
          <p>We have your note and will reply by email{sentTo ? <> to <strong>{sentTo}</strong></> : null}. Please check your spam folder if you do not hear from us.</p>
          <Button variant="light" onClick={() => setState("idle")}>Send another message</Button>
        </div>
      ) : (
        <form className="contact-card form-stack" onSubmit={(event) => void submit(event)} aria-busy={state === "sending"}>
          <div className="form-row form-row--2">
            <TextField label="Your name" value={form.name} onChange={set("name")} autoComplete="name" required maxLength={100} />
            <TextField label="Email address" type="email" value={form.email} onChange={set("email")} autoComplete="email" required maxLength={254} />
          </div>
          <div className="form-row form-row--2">
            <TextField label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" maxLength={30} />
            <TextField label="Subject (optional)" value={form.subject} onChange={set("subject")} maxLength={150} placeholder="What can we help with?" />
          </div>
          <TextArea label="Your message" value={form.message} onChange={set("message")} rows={6} required minLength={5} maxLength={3000} placeholder="Tell us about the piece, size or finish you have in mind." />
          <HoneypotField value={form.website} onChange={(value) => setForm((current) => ({ ...current, website: value }))} />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" loading={state === "sending"}>{state === "sending" ? "Sending..." : "Send message"}</Button>
          <p className="contact-card__note">Your message goes straight to the studio inbox. We only use your details to reply.</p>
        </form>
      )}
    </section>
  );
}
