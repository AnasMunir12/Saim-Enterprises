import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/constants";
export function CustomDesignSection() { return <section className="custom-section" id="custom"><div><p className="eyebrow">Made for you</p><h2>Your idea,<br /><em>made tangible.</em></h2><p>Custom laser cutting, CNC designs, engraving and personalized décor, made with patience and precision.</p><div className="custom-actions"><Link className="button button-light" href="/contact">Explore custom designs <ArrowRight size={16} /></Link><a className="text-link light-link" href={WHATSAPP_LINK}>Talk to the studio <ArrowRight size={16} /></a></div></div><div className="custom-stamp"><Sparkles size={22} /><span>Made to order<br />with care</span></div></section>; }
