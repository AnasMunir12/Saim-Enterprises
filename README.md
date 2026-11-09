This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Image uploads

Admin image uploads are stored in Cloudinary; runtime uploads are not written to the local `public` directory. Configure these server-only variables in the project root `.env.local` for local development and in the Vercel project environment settings for each deployed environment:

```text
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Do not prefix these names with `NEXT_PUBLIC_` or commit their values. Uploads accept JPG, PNG, WebP, and GIF images up to 4 MB. Existing `/uploads/...` references remain supported; new Cloudinary URLs continue to use the existing content fields, with upload metadata recorded separately in MongoDB. No existing images or database records are migrated or deleted automatically.

## Google sign-in setup

Customers can sign in or sign up with "Continue with Google". Until you add credentials the button still renders, but clicking it returns the shopper to `/login` with a friendly "Google sign-in isn't set up yet" message.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or select an existing one) from the project picker at the top.
2. Go to **APIs & Services > OAuth consent screen** (shown as **Google Auth Platform** in newer consoles). Choose **External**, enter the app name (e.g. "Saim Enterprises"), a support email and a developer contact email, and save. While the app is in **Testing**, add the Google accounts you will test with under **Test users**. Publish the app to **Production** when you go live so any Google user can sign in. The default scopes (`openid`, `email`, `profile`) need no review.
3. Go to **APIs & Services > Credentials > Create credentials > OAuth client ID**.
4. Set **Application type** to **Web application** and give it a name.
5. Under **Authorized redirect URIs** click **Add URI** and add exactly:
   - `http://localhost:3000/api/auth/google/callback` (local development)
   - `https://YOUR-PRODUCTION-DOMAIN/api/auth/google/callback` (production placeholder; replace with your real domain)

   Authorized JavaScript origins are not required for this server-side flow.
6. Click **Create**, then copy the **Client ID** and **Client secret**.
7. Paste them into `.env.local` in the project root (see `.env.example`):

   ```bash
   GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

   `NEXTAUTH_URL` must be the site origin and match the redirect URI's scheme, host, and port exactly. In Vercel Production, set it to your custom domain's `https://` origin (for example `https://shop.example.com`), never to localhost. Production requires this setting and HTTPS.
8. Restart `npm run dev` (environment variables are read at startup) and click **Continue with Google** on `/login`.

Behaviour notes: the server verifies Google's ID-token signature and claims before accepting a sign-in. Only Google accounts with a verified email can sign in. A new customer account is created when the email is unused; an existing account already linked to the same Google identity can sign in as usual. Google is not automatically linked to an existing password account: sign in with that account's password instead, so an unverified password signup cannot take over an account. Google never grants admin access to a new account.
