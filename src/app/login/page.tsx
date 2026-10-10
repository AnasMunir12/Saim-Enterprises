import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { authErrorMessage } from "@/components/auth/messages";
import { safeNextPath } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Sign in | Saim Enterprises", robots: { index: false } };

type Params = { error?: string | string[]; reset?: string | string[]; next?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { error, reset, next } = await searchParams;

  return (
    <LoginForm
      initialError={authErrorMessage(first(error))}
      notice={first(reset) === "1" ? "Your password has been updated. Please sign in with your new password." : ""}
      next={safeNextPath(first(next))}
    />
  );
}
