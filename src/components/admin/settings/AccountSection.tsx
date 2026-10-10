"use client";

import { useEffect, useState } from "react";
import { TextField } from "@/components/admin/FormFields";
import { Alert, cardCls, primaryBtn } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

/** Lets the signed-in admin change their own password. The server re-checks everything shown here. */
export function AccountSection() {
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/account/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: { name: string; email: string } | null }) => setMe(data.user))
      .catch(() => setMe(null));
  }, []);

  function problem() {
    if (!currentPassword) return "Enter your current password.";
    if (newPassword.length < PASSWORD_MIN_LENGTH) return `The new password must contain at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return "The new password must contain at least one letter and one number.";
    if (newPassword !== confirmPassword) return "The new passwords do not match.";
    return null;
  }

  async function submit() {
    setDone(false);
    const message = problem();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminFetch("/api/admin/account/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cardCls} aria-labelledby="account-settings">
      <h3 id="account-settings" className="text-lg font-semibold tracking-tight">Account</h3>
      <p className="mt-1 text-sm text-stone-500">{me ? <>Signed in as <strong>{me.name}</strong> ({me.email}). </> : null}Changing the password signs you out of every other browser.</p>
      <form className="mt-5 max-w-md space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }} aria-label="Change password">
        {error ? <Alert onDismiss={() => setError("")}>{error}</Alert> : null}
        {done ? <Alert tone="success" onDismiss={() => setDone(false)}>Your password has been changed.</Alert> : null}
        <TextField label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={setCurrentPassword} />
        <TextField label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} hint={PASSWORD_HINT} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} />
        <button type="submit" disabled={saving} className={primaryBtn}>{saving ? "Changing..." : "Change password"}</button>
      </form>
    </section>
  );
}
