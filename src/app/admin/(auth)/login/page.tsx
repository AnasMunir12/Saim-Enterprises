"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Saim Enterprises</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-500">Restricted area. Authorized administrators only.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-stone-600">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 outline-none focus:border-stone-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center justify-between text-sm text-stone-600">
              Password
              <Link href="/forgot-password" className="text-xs font-medium text-stone-900 underline">Forgot password?</Link>
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 outline-none focus:border-stone-900"
            />
          </label>

          {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          Shopping instead? <Link href="/login" className="font-medium text-stone-900 underline">Customer login</Link>
        </p>
      </div>
    </main>
  );
}
