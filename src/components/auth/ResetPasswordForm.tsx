"use client";

import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthHead, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { PASSWORD_HINT } from "@/lib/password-policy";

function ExpiredLink({ message }: { message: string }) {
  return (
    <>
      <div className="auth__mark auth__mark--warn"><LinkIcon size={24} aria-hidden="true" /></div>
      <AuthHead title="This link cannot be used" />
      <Alert>{message}</Alert>
      <p className="field__hint">Reset links expire after 60 minutes and only work once. Request a fresh one and we will email it right away.</p>
      <ButtonLink href="/forgot-password" size="lg" block>Request a new link</ButtonLink>
      <p className="auth__foot"><Link href="/login">Back to sign in</Link></p>
    </>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; code?: string; redirectTo?: string };

      if (!response.ok) {
        if (data.code === "invalid_link") setExpired(data.message ?? "This reset link has expired or was already used.");
        else setError(data.message ?? "We could not reset your password. Please try again.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo ?? "/login?reset=1");
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return <AuthShell><ExpiredLink message="This reset link is incomplete. Please open the full link from your email, or request a new one." /></AuthShell>;
  }

  if (expired) {
    return <AuthShell><ExpiredLink message={expired} /></AuthShell>;
  }

  return (
    <AuthShell>
      <AuthHead title="Choose a new password">Pick something you have not used elsewhere. You will sign in with it straight after.</AuthHead>
      <form className="form-stack" onSubmit={handleSubmit}>
        <TextField label="New password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} hint={PASSWORD_HINT} />
        <TextField label="Confirm new password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" block loading={loading}>{loading ? "Updating..." : "Update password"}</Button>
      </form>
      <p className="auth__foot"><Link href="/login">Back to sign in</Link></p>
    </AuthShell>
  );
}
