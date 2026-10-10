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

export function LoginForm({ initialError = "", notice = "", next = null }: { initialError?: string; notice?: string; next?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const toCheckout = Boolean(next?.includes("checkout=1"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Customers go back to the page they came from; admins keep their dashboard.
      const target = data.redirectTo ?? "/account";
      router.push(target === "/account" && next ? next : target);
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHead title="Welcome back">
        {toCheckout ? "Sign in to finish your order. Your bag is saved and waiting." : "Sign in to view your orders and check out faster."}
      </AuthHead>

      <GoogleButton next={next} />
      <OrDivider />

      <form className="form-stack" onSubmit={handleSubmit}>
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aside={<Link href="/forgot-password" className="forgot-link">Forgot password?</Link>}
        />
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" block loading={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </form>

      <p className="auth__foot">
        New here? <Link href={next ? authHref("signup", next) : "/signup"}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
