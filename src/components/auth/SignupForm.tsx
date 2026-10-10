"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthHead, AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { authHref } from "@/lib/auth-redirect";
import { PASSWORD_HINT } from "@/lib/password-policy";

export function SignupForm({ initialError = "", next = null }: { initialError?: string; next?: string | null }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const toCheckout = Boolean(next?.includes("checkout=1"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.message ?? "Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push(next ?? data.redirectTo ?? "/account");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell wide>
      <AuthHead title="Create your account">
        {toCheckout ? "Create an account to finish your order. Your bag is saved and waiting." : "Follow your orders, save pieces you love and check out faster."}
      </AuthHead>

      <GoogleButton label="Sign up with Google" next={next} />
      <OrDivider />

      <form className="form-stack" onSubmit={handleSubmit}>
        <TextField label="Full name" required autoComplete="name" maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <div className="form-row form-row--2">
          <TextField label="Password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <TextField label="Confirm password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </div>
        <p className="field__hint">{PASSWORD_HINT}</p>
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" block loading={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      </form>

      <p className="auth__foot">
        Already have an account? <Link href={next ? authHref("login", next) : "/login"}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
