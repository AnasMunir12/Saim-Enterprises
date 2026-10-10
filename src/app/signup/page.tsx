import type { Metadata } from "next";
import { authErrorMessage } from "@/components/auth/messages";
import { SignupForm } from "@/components/auth/SignupForm";
import { safeNextPath } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Create an account | Saim Enterprises", robots: { index: false } };

type Params = { error?: string | string[]; next?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function SignupPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { error, next } = await searchParams;
  return <SignupForm initialError={authErrorMessage(first(error))} next={safeNextPath(first(next))} />;
}
