# What is left

Written for the team picking this project up. Status as of 2026-10-11.

**Honest summary:** everything below under "Built" compiles (`npx tsc --noEmit` clean, `npx eslint src` 0 errors), but most of it has **never been clicked through in a browser**. The first job for the team is a manual test pass (section 1).

Nothing is committed to git yet.

---

## 0. How the app is organised

- One Next.js 16 app (`src/app`). Read `AGENTS.md` first: this Next.js has breaking changes, use `node_modules/next/dist/docs/`. Middleware is `src/proxy.ts`.
- Customers use the site root. The admin dashboard is the same app at `/admin` (own layout, server-side role check on every page and API). Customer pages never link to `/admin`.
- Two roles in `src/models/User.ts`: `admin` (single super admin) and `customer`. Signup can only create customers. There is no public admin signup.
- Session = signed cookie containing user id, role and issue time (`src/lib/session.ts`). Logging in again after a password reset or a suspension invalidates old sessions.
- Admin account: `saimenterprises@gmail.com`. `scripts/ensure-admin.mjs` promotes or creates it without touching an existing password.
- Admin mutations must call `requireAdminUser()` (`src/lib/auth.ts`). API routes are not covered by `proxy.ts`, so they must authorise themselves.
- Storefront pages and APIs are intentionally `force-dynamic` / no-store so admin changes show immediately. Do not add `revalidate` or static caching without re-checking this.
- Styles: `src/styles/` driven by CSS variables in `tokens.css`. Shared UI in `src/components/ui/`, admin building blocks in `src/components/admin/` (`CrudPage`, `FormFields`, `GalleryField`, `useAdminResource`), helpers in `src/lib/{crud,validate,api}.ts`.

---

## 1. Must do first: manual test pass (nothing below was browser-tested unless stated)

Previously browser-verified (earlier in the project, before later rewrites): homepage, catalog, product page, cart, sign-in step at checkout, placing an order, `/track`. The storefront CSS and components were rewritten afterwards, so re-check them too.

Never run at all in a browser:

- [ ] Admin: every page under `/admin` (products, orders, customers, customer queries, categories, collections, hero slides, homepage sections, testimonials, site content, settings). For each: create, edit, delete, then confirm the customer site changes immediately.
- [ ] Stock rules: confirming an order lowers stock once; cancelling restores it once; sold-out and "only N left" display on cards and product pages; over-stock orders are refused.
- [ ] Customer: signup, login, logout, `/account` (profile, wishlist, orders), heart toggle, place order while signed out (cart must survive login), order confirmation, `/track`.
- [ ] Forgot password and reset password, end to end (link in the email, 60 min expiry, single use, old session logged out, old password stops working).
- [ ] Google sign-in (see section 3).
- [ ] Contact form -> appears in Admin > Customer Queries; owner email is sent.
- [ ] Settings: phone, WhatsApp number, email, address save and appear on the contact page, footer, announcement bar and WhatsApp button; "Show WhatsApp button" toggle.
- [ ] Site content editors: trust strip, FAQ, About / Shipping / Returns / Privacy / Terms pages ("Restore default" works, defaults unchanged until edited).
- [ ] Product with a main image plus up to 7 more shows a working gallery.
- [ ] Customer suspend / reactivate / delete rules; admin cannot suspend, delete or demote itself; admin can change own password in Settings > Account.
- [ ] Mobile (375px), tablet and desktop for all customer pages; mobile sticky add-to-bag bar vs WhatsApp button vs cart drawer overlap.
- [ ] `npm run build` has never been run (only the dev server). Run it and fix anything it reports.

---

## 2. Owner decisions and content (not code)

- [ ] **Review the placeholder wording** on Shipping, Returns & Exchange, Privacy, Terms, FAQ and About. It was written as a starting point, not as the shop's real policies. Edit them in Dashboard > Site content (or ask a lawyer for Privacy / Terms).
- [ ] The trust-strip claims ("Returns and exchange", "Careful packaging") must be true for the business.
- [ ] Fill in **Dashboard > Settings** with the real phone, WhatsApp number, public email, address, opening hours and social links. Until then the site falls back to the hard-coded `BUSINESS_*` / `WHATSAPP_NUMBER` constants in `src/lib/constants.ts`.
- [ ] Replace the stock (Unsplash) gallery photos with real product photos.
- [ ] Real products, categories, collections, hero slides, testimonials. The database currently holds only the admin user and an empty settings record.
- [ ] Decide on star ratings. The fake 4.9-star ratings were removed. A real reviews feature (see section 5) is needed to bring ratings back honestly.

---

## 3. Credentials and external services

### Google sign-in ("Continue with Google")

**Current state.** The code is finished: `src/app/api/auth/google/route.ts` (start), `src/app/api/auth/google/callback/route.ts` (return trip), `src/lib/google-oauth.ts`. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are already in `.env.local`. Clicking the button already sends the browser to Google's sign-in page with our client ID, so the first half works. The **return trip** (Google sending the person back to our site) has never completed, because Google refuses it until the two settings in steps 3 and 4 below are made. Until then, expect an error page from Google such as `redirect_uri_mismatch` or `Access blocked`.

**Why the redirect URI matters.** After the person signs in at Google, Google sends them back to one exact web address on our site. Google only does that for addresses we have registered in advance. Our address is:

- Local development: `http://localhost:3000/api/auth/google/callback`
- Production (once the domain exists): `https://YOUR-DOMAIN/api/auth/google/callback`

It must match character for character (same scheme `http`/`https`, same host, same port, same path, no trailing slash). It is built from `NEXTAUTH_URL` in `.env.local`, so `NEXTAUTH_URL` must be `http://localhost:3000` locally and `https://YOUR-DOMAIN` in production.

**Step by step, in Google Cloud Console** (sign in with the Google account that owns the project that the client ID belongs to; the client ID starts with `286065861498-`):

1. Open https://console.cloud.google.com and sign in.
2. At the top left, click the **project selector** and choose the project that contains this OAuth client (its project number is `286065861498`). If it does not appear, you are signed in with the wrong Google account.
3. **Register the redirect URI.**
   1. Left menu: **APIs & Services** -> **Credentials**.
   2. Under **OAuth 2.0 Client IDs**, click the client whose ID starts with `(the value of GOOGLE_CLIENT_ID in .env.local)`. (It must be of type **Web application**. If it is not, create a new one with **+ Create credentials** -> **OAuth client ID** -> Application type **Web application**, then put the new ID and secret in `.env.local`.)
   3. Under **Authorized redirect URIs** click **+ Add URI** and paste `http://localhost:3000/api/auth/google/callback`. Click **+ Add URI** again and add the production one, `https://YOUR-DOMAIN/api/auth/google/callback`, when the domain exists.
   4. Leave **Authorized JavaScript origins** empty (not needed for this server-side flow), or add `http://localhost:3000` and `https://YOUR-DOMAIN`, which is harmless.
   5. Click **Save**. Google can take a few minutes (rarely up to an hour) to apply it.
4. **Allow people to sign in (consent screen).**
   1. Left menu: **APIs & Services** -> **OAuth consent screen** (in newer consoles this is **Google Auth Platform** -> **Audience**).
   2. Check **Publishing status**.
      - **Testing:** only the emails listed under **Test users** can sign in; everyone else sees "Access blocked". Click **+ Add users** and add every email that should be able to sign in (your own address, the team's, `saimenterprises@gmail.com`), then **Save**. Test mode is fine while developing.
      - **In production:** click **Publish app** / **Make external** so any Google user can sign in. Required before launch. Because we only request the basic `openid email profile` scopes, Google normally does not require a full verification review for these.
   3. Under **Data access / Scopes**, make sure only `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile` are listed (our code requests exactly these).
   4. Fill the consent screen details if asked: app name (Saim Enterprises), user support email, developer contact email, and (for production) the app logo, home page, privacy policy link (`https://YOUR-DOMAIN/privacy`) and terms link (`https://YOUR-DOMAIN/terms`).
5. **Make sure the secret in `.env.local` matches this client.** On the same client page, check the client ID. If the secret was lost or leaked, click **+ Add secret** (or **Reset secret**) there, copy the new value into `GOOGLE_CLIENT_SECRET` in `.env.local`, and restart `npm run dev`. The secret is only shown when created, so copy it right away.
6. **Restart** the dev server after any `.env.local` change (`Ctrl+C`, `npm run dev`).

**How to test it once steps 3 and 4 are done.**
1. Open http://localhost:3000/login in a private/incognito window (so no old session interferes).
2. Click **Continue with Google**, pick a Google account that is on the Test users list.
3. Expected: you land on `/account` (a normal customer). Signing in with `saimenterprises@gmail.com` lands in `/admin/dashboard` because that email is the admin.
4. Test both cases: a brand-new Google email (a customer account is created, no password) and an email that already has a password account (the Google login links to that same account).
5. Check the MongoDB `users` collection: the new user has `googleId` set and `role: "customer"`.

**If it fails, the error tells you what is wrong:**

| What you see | Cause and fix |
|---|---|
| Google page: `Error 400: redirect_uri_mismatch` | Step 3 not saved or typed differently. Compare the URI shown in the error with the registered one, character by character, including `http` vs `https` and the port. |
| `Access blocked: ... has not completed the Google verification process` / `Error 403: access_denied` | App is in Testing and this email is not under Test users (step 4), or publish the app. |
| `Error 401: invalid_client` | `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in `.env.local` is wrong or the dev server was not restarted (step 5, 6). |
| Redirected back to `/login?error=google_not_configured` | `GOOGLE_CLIENT_ID` is empty or missing in `.env.local`. |
| Redirected back to `/login` with an error message after Google | State or cookie mismatch (cookies blocked, or the callback opened in another browser/host such as `127.0.0.1` instead of `localhost`), or the Google email is not verified. Always use the same host that `NEXTAUTH_URL` names. |

**Security notes.**
- [ ] The client secret was pasted into a chat during development. Rotate it (step 5) before production.
- [ ] Only emails Google marks as verified are accepted. A Google login with an existing account's email links to that account, so keep the admin mailbox secure and turn on 2-step verification for `saimenterprises@gmail.com`.
- [ ] Production: set `NEXTAUTH_URL` to the real `https://` URL, register that callback URI, and publish the consent screen.

### Email (password reset and new-query alerts)
`src/lib/email.ts` supports SMTP (nodemailer), then Resend, then a development log. Nothing real has been sent yet.

- [ ] Fill ONE option in `.env.local` (a commented template is already at the bottom of the file; `.env.example` has examples): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (Gmail needs an App Password) or `RESEND_API_KEY` + `EMAIL_FROM`.
- [ ] Restart `npm run dev`, request a password reset and submit the contact form, confirm both emails arrive.
- [ ] Without a provider, development writes mail to `.dev-emails.log` (git-ignored); **production sends nothing**.
- [ ] Set `NEXTAUTH_URL` to the real site URL: reset links are built from it.

---

## 4. Before going live

- [ ] **Rotate every secret that was shared in chat**: the MongoDB database user password, `NEXTAUTH_SECRET`, the Google client secret, and the current admin password (the owner knows it; change it in Dashboard > Settings > Account right after first login).
- [ ] **Restrict MongoDB Atlas network access.** It currently allows `0.0.0.0/0` (anywhere). Replace with the hosting provider's IPs. Also consider naming the database in `MONGO_URI` (it currently uses the default database `test`; existing data lives there).
- [ ] Turn on 2-step verification for `saimenterprises@gmail.com` (Google sign-in with that email lands in the admin dashboard).
- [ ] **Image uploads are stored on local disk** (`public/uploads`, written by `src/app/api/uploads/route.ts`, 5 MB, JPG/PNG/WEBP/GIF). On serverless hosts (e.g. Vercel) this disk is wiped on deploy. Move uploads to Cloudinary / S3 / similar before launch. Then configure `images.remotePatterns` in `next.config.ts` and consider switching `<img>` (5 lint warnings) to `next/image`.
- [ ] The rate limiter (`src/lib/rate-limit.ts`) is in memory, per server instance. Use Redis/Upstash if running more than one instance.
- [ ] Set `NEXT_PUBLIC_SITE_URL` in production (canonical URLs and product JSON-LD).
- [ ] Set `NODE_ENV=production` hosting env, HTTPS only (the session cookie is `secure` in production).
- [ ] Add a favicon / social share image if wanted; check page titles and meta descriptions from Settings.
- [ ] Run `npm audit` (the install reported vulnerabilities) and update dependencies.
- [ ] Decide on a backup plan for MongoDB (Atlas backups).

---

## 5. Not built yet (ideas in rough priority)

Admin back-office features a mature shop usually has:

- [ ] Activity log (who changed what: prices, order status, settings).
- [ ] Discount / coupon codes (the reference store pushes a welcome code).
- [ ] CSV export of orders, customers, products.
- [ ] Printable invoice and packing slip; order notes.
- [ ] Refunds / returns handling (the site promises easy returns).
- [ ] Low-stock alerts (email or banner). Today low stock only shows in the dashboard.
- [ ] Staff roles (Manager, Fulfilment, Support). Today there is one super admin.
- [ ] Customer reviews with "Verified purchase", plus admin moderation, then real star ratings on cards.

Customer side:

- [ ] Online payment (checkout is currently an order request: the shop contacts the customer to confirm payment and delivery).
- [ ] Order status emails to customers.
- [ ] Saved addresses, product variants (size/colour) if the catalog needs them.
- [ ] Contact-form replies from the dashboard (today the owner replies from their own email / WhatsApp).
- [ ] The password reset is link-based. If the owner prefers a one-time numeric code, that is a change to `api/auth/forgot-password` and `reset-password`.

---

## 6. Known gaps and quirks

- Products with `stock` 0 cannot be ordered. Stock is deducted when the admin **confirms** an order, not when it is placed.
- Customers with orders cannot be deleted (suspend instead). A category that still has products cannot be deleted.
- Uploaded images are not deleted from disk when a product/slide/testimonial is deleted.
- The About page now renders through `PolicyPage`, so its layout differs slightly from the original. Page titles support a small `*italic*` markup.
- Page text uses a tiny safe markup (blank line = paragraph, `## ` = heading, `- ` = bullet). Admin text is never rendered as raw HTML.
- Dev-only: `User.ts` / `Settings.ts` re-register their Mongoose models in development because hot reload kept stale schemas.
- Old login cookies without a role are rejected on purpose, so everyone signs in again after deploying.
- The `Order` model gained `stockAdjusted`; do not remove it (it makes confirm/cancel stock changes idempotent).
