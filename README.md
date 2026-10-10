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

   `NEXTAUTH_URL` must match the host in the redirect URI exactly (scheme, host and port). In production set it to your public `https://` URL.
8. Restart `npm run dev` (environment variables are read at startup) and click **Continue with Google** on `/login`.

Behaviour notes: only Google accounts with a verified email can sign in. If a Google email matches an existing account, Google is linked to that account; otherwise a new customer account is created without a password. Google never grants admin access to a new account.
