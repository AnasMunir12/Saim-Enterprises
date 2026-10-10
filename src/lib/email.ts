import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

// Email provider abstraction, chosen from the environment in this order:
//   1. SMTP_HOST set      -> SMTP through nodemailer (Gmail, any mail host)
//   2. RESEND_API_KEY set -> Resend's REST API
//   3. neither            -> development logs the message (including links) to the server console and to the
//                            git-ignored .dev-emails.log file; production logs an error and sends nothing.
// Empty values count as unset. A provider failure throws; callers run after the response and log it.
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult = { sent: boolean; provider: "smtp" | "resend" | "dev" | "none" };

const BRAND = "Saim Enterprises";
const SMTP_TIMEOUT_MS = 15_000;

const env = (name: string) => process.env[name]?.trim() ?? "";

async function sendWithSmtp(message: EmailMessage, host: string) {
  const user = env("SMTP_USER");
  const from = env("EMAIL_FROM") || (user.includes("@") ? `${BRAND} <${user}>` : "");
  if (!from) throw new Error("EMAIL_FROM is required when sending through SMTP.");

  const transport = nodemailer.createTransport({
    host,
    port: Number(env("SMTP_PORT")) || 587,
    secure: env("SMTP_SECURE").toLowerCase() === "true",
    auth: user ? { user, pass: env("SMTP_PASS") } : undefined,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
  try {
    await transport.sendMail({ from, to: message.to, subject: message.subject, html: message.html, text: message.text });
  } finally {
    transport.close();
  }
}

async function sendWithResend(message: EmailMessage, apiKey: string) {
  const from = env("EMAIL_FROM") || `${BRAND} <onboarding@resend.dev>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
  });

  if (!response.ok) {
    throw new Error(`Resend responded with ${response.status}`);
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const smtpHost = env("SMTP_HOST");
  if (smtpHost) {
    await sendWithSmtp(message, smtpHost);
    return { sent: true, provider: "smtp" };
  }

  const resendKey = env("RESEND_API_KEY");
  if (resendKey) {
    await sendWithResend(message, resendKey);
    return { sent: true, provider: "resend" };
  }

  if (process.env.NODE_ENV !== "production") {
    const entry = [
      "",
      "========== DEV EMAIL ==========",
      `Time:    ${new Date().toISOString()}`,
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      "",
      message.text,
      "===============================",
      "",
    ].join("\n");

    console.log(entry);
    try {
      await appendFile(join(process.cwd(), ".dev-emails.log"), entry);
    } catch {
      // The file is only a convenience for local testing.
    }

    return { sent: true, provider: "dev" };
  }

  console.error("Email not sent: no email provider is configured (set SMTP_HOST or RESEND_API_KEY, and EMAIL_FROM).");
  return { sent: false, provider: "none" };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildPasswordResetEmail(opts: { name: string; link: string; hasPassword: boolean }): Omit<EmailMessage, "to"> {
  const name = opts.name.trim() || "there";
  const intro = opts.hasPassword
    ? "We received a request to reset the password for your Saim Enterprises account."
    : "We received a request to set a password for your Saim Enterprises account. You currently sign in with Google; setting a password lets you also sign in with your email. You can keep using Google either way.";
  const action = opts.hasPassword ? "Reset password" : "Set password";
  const expiry = "This link expires in 60 minutes and can be used once.";
  const ignore = "If you did not request this, you can safely ignore this email; your account has not been changed.";

  const text = [`Hi ${name},`, "", intro, "", `${action}: ${opts.link}`, "", expiry, ignore, "", "Saim Enterprises"].join("\n");

  const safeLink = escapeHtml(opts.link);
  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:28px;">
<tr><td>
<p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#78716c;">Saim Enterprises</p>
<h1 style="margin:8px 0 16px;font-size:24px;">${escapeHtml(action)}</h1>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">${escapeHtml(intro)}</p>
<p style="margin:0 0 20px;"><a href="${safeLink}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;">${escapeHtml(action)}</a></p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#57534e;">${escapeHtml(expiry)}</p>
<p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#57534e;">${escapeHtml(ignore)}</p>
<p style="margin:0;font-size:11px;line-height:1.6;color:#a8a29e;word-break:break-all;">Button not working? Paste this link into your browser:<br>${safeLink}</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject: opts.hasPassword ? "Reset your Saim Enterprises password" : "Set a password for your Saim Enterprises account", html, text };
}

export function buildContactNotificationEmail(opts: { id: string; name: string; email: string; phone?: string; subject?: string; message: string }): Omit<EmailMessage, "to"> {
  const subject = `New website message from ${opts.name}${opts.subject ? `: ${opts.subject}` : ""}`.slice(0, 200);
  const lines = [`Name: ${opts.name}`, `Email: ${opts.email}`, ...(opts.phone ? [`Phone: ${opts.phone}`] : []), ...(opts.subject ? [`Subject: ${opts.subject}`] : [])];
  const text = ["You have a new message from the contact form.", "", ...lines, "", opts.message, "", "Open Customer Queries in the admin dashboard to read it. Reply to the sender by email.", `Reference: ${opts.id}`].join("\n");

  const rows = lines.map((line) => `<p style="margin:0 0 4px;font-size:14px;line-height:1.5;">${escapeHtml(line)}</p>`).join("");
  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:28px;">
<tr><td>
<p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#78716c;">Saim Enterprises</p>
<h1 style="margin:8px 0 16px;font-size:22px;">New website message</h1>
${rows}
<p style="margin:16px 0;padding:14px;background:#f5f5f4;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.message)}</p>
<p style="margin:0;font-size:12px;color:#78716c;">Open Customer Queries in the admin dashboard to read it. Reply to the sender by email. Reference ${escapeHtml(opts.id)}.</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject, html, text };
}
