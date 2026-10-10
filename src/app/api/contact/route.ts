import { createHmac } from "node:crypto";
import { NextResponse, after } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { cleanText } from "@/lib/contact-message";
import { BUSINESS_EMAIL } from "@/lib/constants";
import { buildContactNotificationEmail, sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { createId } from "@/lib/site-data";
import { ContactMessage } from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const HOUR = 60 * 60 * 1000;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[0-9+()\-\s]{6,30}$/;
const THANKS = "Thank you. Your message has been sent and we will reply as soon as we can.";

function hashIp(ip: string) {
  // Keyed hash so the stored value cannot be reversed by trying every IPv4 address.
  return createHmac("sha256", process.env.NEXTAUTH_SECRET || "contact-ip").update(ip).digest("hex").slice(0, 32);
}

function tooMany() {
  return NextResponse.json({ message: "You have sent several messages recently. Please wait a while before trying again, or reach us on WhatsApp." }, { status: 429, headers: { ...NO_STORE, "Retry-After": "3600" } });
}

// Public endpoint: anyone can send the shop a message. Everything is validated, length-limited and stripped of
// control characters; a hidden honeypot field and per-IP / per-email rate limits keep bots out.
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);

    // Coarse guard against floods of malformed requests (not counted against honest visitors fixing a typo).
    if (!rateLimit(`contact:req:${ip}`, 60, 10 * 60 * 1000)) return tooMany();

    let body: Record<string, unknown>;
    try {
      const parsed = (await request.json()) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400, headers: NO_STORE });
    }

    // Honeypot: real visitors never see or fill "website". Pretend success to bots and store nothing.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ message: THANKS }, { status: 201, headers: NO_STORE });
    }

    for (const key of ["name", "email", "phone", "subject", "message"]) {
      const value = body[key];
      if (value !== undefined && value !== null && typeof value !== "string") {
        return NextResponse.json({ message: "Invalid form data." }, { status: 400, headers: NO_STORE });
      }
    }
    const text = (key: string, multiline = false) => cleanText(typeof body[key] === "string" ? (body[key] as string) : "", multiline);
    const name = text("name");
    const email = text("email").toLowerCase();
    const phone = text("phone");
    const subject = text("subject");
    const message = text("message", true);

    const fail = (reason: string) => NextResponse.json({ message: reason }, { status: 400, headers: NO_STORE });
    if (!name) return fail("Please enter your name.");
    if (name.length > 100) return fail("Your name must be 100 characters or fewer.");
    if (!email || email.length > 254 || !EMAIL.test(email)) return fail("Please enter a valid email address.");
    if (phone && !PHONE.test(phone)) return fail("Please enter a valid phone number, or leave it empty.");
    if (subject.length > 150) return fail("The subject must be 150 characters or fewer.");
    if (message.length < 5) return fail("Please write a short message so we know how to help.");
    if (message.length > 3000) return fail("Your message must be 3000 characters or fewer.");

    // Strict limits on valid submissions: 5 per hour per IP address and 5 per hour per email address.
    if (!rateLimit(`contact:ip:${ip}`, 5, HOUR) || !rateLimit(`contact:email:${email}`, 5, HOUR)) return tooMany();

    const user = await getCurrentUser().catch(() => null);

    await connectDB();
    const doc = await ContactMessage.create({
      _id: createId("msg"),
      name,
      email,
      ...(phone ? { phone } : {}),
      ...(subject ? { subject } : {}),
      message,
      status: "new",
      ipHash: hashIp(ip),
      ...(user ? { userId: user.id } : {}),
    });

    // Tell the owner by email. Runs after the response and can never make the request fail.
    after(async () => {
      try {
        const settings = await getSettings().catch(() => null);
        const to = settings?.contactEmail || BUSINESS_EMAIL;
        const mail = buildContactNotificationEmail({ id: String(doc._id), name, email, phone, subject, message });
        await sendEmail({ to, ...mail });
      } catch (error) {
        console.error("Contact notification email failed:", error instanceof Error ? error.message : error);
      }
    });

    return NextResponse.json({ message: THANKS }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error("Contact message failed:", error);
    return NextResponse.json({ message: "We could not send your message right now. Please try again, or contact us on WhatsApp." }, { status: 500, headers: NO_STORE });
  }
}
