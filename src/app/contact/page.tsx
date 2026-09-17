import { ArrowRight, Mail, Phone } from "lucide-react";
import { PageChrome } from "@/components/layout/PageChrome";
import { Button } from "@/components/ui/Button";
import { BUSINESS_EMAIL, BUSINESS_PHONE, WHATSAPP_LINK } from "@/lib/constants";

export default function ContactPage() {
  return <PageChrome><section className="page-hero"><p className="eyebrow">Come say hello</p><h1>Let&apos;s make<br /><em>something meaningful.</em></h1></section><section className="info-page"><div><p className="eyebrow">The studio</p><h2>Have an idea?<br />We&apos;d love to hear it.</h2><p>For custom laser-cut, CNC, engraving and décor enquiries, send us a note or reach out directly.</p><div className="contact-details"><p><Phone size={16} /> {BUSINESS_PHONE}</p><p><Mail size={16} /> {BUSINESS_EMAIL}</p><a href={WHATSAPP_LINK}>WhatsApp the studio <ArrowRight size={16} /></a></div></div><form className="contact-form"><input placeholder="Your name" aria-label="Your name" required /><input type="email" placeholder="Email address" aria-label="Email address" required /><input placeholder="What can we make for you?" aria-label="What can we make for you" required /><textarea placeholder="Tell us a little about your idea" aria-label="Tell us about your idea" /><Button type="submit">Send enquiry <ArrowRight size={16} /></Button></form></section></PageChrome>;
}
