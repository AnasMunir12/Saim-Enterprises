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
  replyTo?: string;
  from?: string;
};

export type SendResult = { sent: boolean; provider: "smtp" | "resend" | "dev" | "none" };

const BRAND = "Saim Enterprises";
const SMTP_TIMEOUT_MS = 15_000;

const env = (name: string) => process.env[name]?.trim() ?? "";

export type OrderNotificationTemplateParams = {
  to_email: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_items: string;
  order_total: string;
  delivery_address: string;
  order_date: string;
};

export async function sendOrderNotificationEmailJS(templateParams: OrderNotificationTemplateParams) {
  const serviceId = env("EMAILJS_SERVICE_ID");
  const publicKey = env("EMAILJS_PUBLIC_KEY");
  const privateKey = env("EMAILJS_PRIVATE_KEY");
  const templateId = env("EMAILJS_ADMIN_TEMPLATE_ID");
  const missing = [
    !serviceId && "EMAILJS_SERVICE_ID",
    !publicKey && "EMAILJS_PUBLIC_KEY",
    !privateKey && "EMAILJS_PRIVATE_KEY",
    !templateId && "EMAILJS_ADMIN_TEMPLATE_ID",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    throw new Error(`EmailJS order notification is missing configuration: ${missing.join(", ")}`);
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    throw new Error(`EmailJS order notification failed with status ${response.status}`);
  }
}

async function sendWithSmtp(message: EmailMessage, host: string) {
  const user = env("SMTP_USER");
  const from = message.from || env("EMAIL_FROM") || (user.includes("@") ? `${BRAND} <${user}>` : "");
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
    await transport.sendMail({
      from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } finally {
    transport.close();
  }
}

async function sendWithResend(message: EmailMessage, apiKey: string) {
  const from = message.from || env("EMAIL_FROM") || "Saim Enterprises <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Be" + "arer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      ...(message.replyTo ? { reply_to: [message.replyTo] } : {}),
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error("Resend responded with " + response.status);
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

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value || 0);
}

export function buildOrderConfirmationEmail(opts: {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryCharges: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  businessEmail: string;
}): Omit<EmailMessage, "to"> {
  const rows = opts.items.map((item) => `- ${item.name} x${item.quantity} — ${formatCurrency(item.price * item.quantity)}`).join("\n");
  const text = [
    `Dear ${opts.customerName},`,
    "",
    "Thank you for choosing Saim Enterprises!",
    "",
    "We have successfully received your order and truly appreciate your trust in our business.",
    "",
    "Your Order Details",
    `- Order Number: ${opts.orderNumber}`,
    `- Order Date: ${opts.orderDate}`,
    `- Products: ${opts.items.map((item) => item.name).join(", ")}`,
    `- Quantities: ${opts.items.map((item) => `${item.quantity}`).join(", ")}`,
    `- Product Prices: ${opts.items.map((item) => `${item.name} @ ${formatCurrency(item.price)}`).join(", ")}`,
    `- Order Summary: ${rows}`,
    `- Subtotal: ${formatCurrency(opts.subtotal)}`,
    `- Delivery Charges: ${formatCurrency(opts.deliveryCharges)}`,
    `- Total Amount: ${formatCurrency(opts.total)}`,
    `- Payment Method: ${opts.paymentMethod}`,
    `- Payment Status: ${opts.paymentStatus}`,
    `- Delivery Address: ${opts.shippingAddress}`,
    "",
    "Our team will review and process your order. We will keep you informed about its progress.",
    "",
    `If you have any questions regarding your order, please contact us at ${opts.businessEmail}.`,
    "",
    "Thank you for shopping with Saim Enterprises. We look forward to serving you again!",
    "",
    "Best regards,",
    "Saim Enterprises",
    "Customer Support Team",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;overflow:hidden;">
<tr><td style="padding:24px 28px 12px;background:#fafaf9;">
<p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#78716c;">Saim Enterprises</p>
<h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#1c1917;">Thank You for Your Order</h1>
</td></tr>
<tr><td style="padding:0 28px 12px;">
<p style="margin:18px 0 0;font-size:16px;line-height:1.7;color:#292524;">Dear ${escapeHtml(opts.customerName)},</p>
<p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#292524;">Thank you for choosing Saim Enterprises! We have successfully received your order and truly appreciate your trust in our business.</p>
</td></tr>
<tr><td style="padding:0 28px 8px;">
<h2 style="margin:20px 0 12px;font-size:22px;color:#1c1917;">Your Order Details</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#292524;">
  <tr><td style="padding:6px 0;width:42%;color:#57534e;">Order Number</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.orderNumber)}</td></tr>
  <tr><td style="padding:6px 0;color:#57534e;">Order Date</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.orderDate)}</td></tr>
  <tr><td style="padding:6px 0;color:#57534e;">Payment Method</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.paymentMethod)}</td></tr>
  <tr><td style="padding:6px 0;color:#57534e;">Payment Status</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.paymentStatus)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 28px 12px;">
<div style="margin-top:18px;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#f5f5f4;"><th align="left" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Product</th><th align="right" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Qty</th><th align="right" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Price</th></tr></thead>
  <tbody>
    ${opts.items.map((item) => `<tr><td style="padding:12px 14px;border-top:1px solid #e7e5e4;">${escapeHtml(item.name)}</td><td align="right" style="padding:12px 14px;border-top:1px solid #e7e5e4;">${item.quantity}</td><td align="right" style="padding:12px 14px;border-top:1px solid #e7e5e4;">${escapeHtml(formatCurrency(item.price * item.quantity))}</td></tr>`).join("")}
  </tbody>
</table>
</div>
</td></tr>
<tr><td style="padding:0 28px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#292524;">
  <tr><td style="padding:8px 0;color:#57534e;">Subtotal</td><td align="right" style="padding:8px 0;font-weight:600;">${escapeHtml(formatCurrency(opts.subtotal))}</td></tr>
  <tr><td style="padding:8px 0;color:#57534e;">Delivery Charges</td><td align="right" style="padding:8px 0;font-weight:600;">${escapeHtml(formatCurrency(opts.deliveryCharges))}</td></tr>
  <tr><td style="padding:8px 0;color:#57534e;">Total Amount</td><td align="right" style="padding:8px 0;font-weight:700;font-size:16px;">${escapeHtml(formatCurrency(opts.total))}</td></tr>
  <tr><td style="padding:8px 0;color:#57534e;">Delivery Address</td><td align="right" style="padding:8px 0;font-weight:600;max-width:220px;">${escapeHtml(opts.shippingAddress)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 28px 20px;font-size:15px;line-height:1.7;color:#292524;">
<p style="margin:0;">Our team will review and process your order. We will keep you informed about its progress.</p>
<p style="margin:16px 0 0;">If you have any questions regarding your order, please contact us at <a href="mailto:${escapeHtml(opts.businessEmail)}" style="color:#1c1917;text-decoration:underline;">${escapeHtml(opts.businessEmail)}</a>.</p>
<p style="margin:16px 0 0;">Thank you for shopping with Saim Enterprises. We look forward to serving you again!</p>
<p style="margin:18px 0 0;">Best regards,<br><strong>Saim Enterprises</strong><br>Customer Support Team</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject: "Thank You for Your Order – Saim Enterprises", html, text };
}

export function buildOrderAdminNotificationEmail(opts: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
}): Omit<EmailMessage, "to"> {
  const rows = opts.items.map((item) => `- ${item.name} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}`).join("\n");
  const text = [
    "New order received at Saim Enterprises.",
    "",
    `Order Number: ${opts.orderNumber}`,
    `Customer Name: ${opts.customerName}`,
    `Customer Email: ${opts.customerEmail}`,
    ...(opts.phone ? [`Customer Phone: ${opts.phone}`] : []),
    `Payment Method: ${opts.paymentMethod}`,
    `Payment Status: ${opts.paymentStatus}`,
    `Shipping Address: ${opts.shippingAddress}`,
    "",
    "Ordered Products:",
    rows,
    "",
    `Total Amount: ${formatCurrency(opts.total)}`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e7e5e4;border-radius:18px;padding:28px;">
<tr><td>
<p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#78716c;">Saim Enterprises</p>
<h1 style="margin:10px 0 18px;font-size:24px;line-height:1.3;">New order received</h1>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Order Number:</strong> ${escapeHtml(opts.orderNumber)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(opts.customerName)} (${escapeHtml(opts.customerEmail)})</p>
${opts.phone ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Phone:</strong> ${escapeHtml(opts.phone)}</p>` : ""}
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Payment Method:</strong> ${escapeHtml(opts.paymentMethod)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><strong>Payment Status:</strong> ${escapeHtml(opts.paymentStatus)}</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;"><strong>Shipping Address:</strong> ${escapeHtml(opts.shippingAddress)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#f5f5f4;"><th align="left" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Product</th><th align="right" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Qty</th><th align="right" style="padding:12px 14px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">Amount</th></tr></thead>
  <tbody>
    ${opts.items.map((item) => `<tr><td style="padding:12px 14px;border-top:1px solid #e7e5e4;">${escapeHtml(item.name)}</td><td align="right" style="padding:12px 14px;border-top:1px solid #e7e5e4;">${item.quantity}</td><td align="right" style="padding:12px 14px;border-top:1px solid #e7e5e4;">${escapeHtml(formatCurrency(item.price * item.quantity))}</td></tr>`).join("")}
  </tbody>
</table>
<p style="margin:18px 0 0;font-size:16px;line-height:1.6;font-weight:700;">Total Amount: ${escapeHtml(formatCurrency(opts.total))}</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject: `New order received – ${opts.orderNumber}`, html, text };
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
