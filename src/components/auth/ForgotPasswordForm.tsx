"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthHead, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSentTo(email.trim());
      setLoading(false);
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="auth__mark"><MailCheck size={26} aria-hidden="true" /></div>
        <AuthHead title="Check your email" />
        <div className="form-stack" role="status">
          <p>
            If an account exists for <strong>{sentTo}</strong>, we have emailed it a link to reset your password.
            The link is valid for <strong>60 minutes</strong> and works once.
          </p>
          <ol className="auth__steps">
            <li>Open the email from Saim Enterprises. If you cannot see it, check your spam or promotions folder.</li>
            <li>Select <strong>Reset password</strong> in the email.</li>
            <li>Choose a new password, then sign in with it.</li>
          </ol>
          <p className="field__hint">You signed up with Google? The same link lets you add a password too, and Google sign-in keeps working.</p>
        </div>
        <Button variant="outline" block onClick={() => setSentTo("")}>Use a different email</Button>
        <p className="auth__foot"><Link href="/login">Back to sign in</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHead title="Forgot your password?">Enter the email you signed up with. We will email you a link to choose a new one, valid for 60 minutes.</AuthHead>
      <form className="form-stack" onSubmit={handleSubmit}>
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" block loading={loading}>{loading ? "Sending..." : "Email me a reset link"}</Button>
      </form>
      <p className="auth__foot">Remembered it? <Link href="/login">Back to sign in</Link></p>
      <ButtonLink href="/signup" variant="light" block>Create an account instead</ButtonLink>
    </AuthShell>
  );
}
