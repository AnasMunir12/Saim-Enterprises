import { Camera } from "lucide-react";
import Link from "next/link";
import { BUSINESS_EMAIL, WHATSAPP_LINK } from "@/lib/constants";

export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><div><Link className="wordmark footer-mark" href="/">saim <i>enterprises</i></Link><p>Handcrafted objects for<br />considered homes.</p></div><div><p className="footer-label">Explore</p><Link href="/catalog">Catalog</Link><Link href="/about">Our story</Link><Link href="/contact">Custom pieces</Link></div><div><p className="footer-label">Say hello</p><a href={`mailto:${BUSINESS_EMAIL}`}>Email us</a><a href={WHATSAPP_LINK}>WhatsApp</a><Link href="/contact">Contact</Link></div><div><p className="footer-label">Follow along</p><a href="#top"><Camera size={16} /> Instagram</a></div></div><div className="footer-bottom"><span>© 2026 Saim Enterprises</span><span>Thoughtfully made in Pakistan</span><span>Privacy &nbsp; Shipping &nbsp; Returns</span></div></footer>;
}
