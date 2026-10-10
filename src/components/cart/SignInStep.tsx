"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { authHref, withCheckoutIntent } from "@/lib/auth-redirect";

// Shown when a signed-out visitor presses Checkout. The bag is kept in this browser, so after signing in the
// shopper returns here with everything still in it.
export function SignInStep({ onBack, onNavigate }: { onBack: () => void; onNavigate: () => void }) {
  const next = withCheckoutIntent(`${window.location.pathname}${window.location.search}${window.location.hash}`);

  return (
    <div className="signin-step">
      <button type="button" className="cart-back" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Back to bag</button>
      <h3 id="signin-step-title">Sign in or create an account to place your order</h3>
      <p className="signin-step__lead">An account lets you follow your order from our studio to your door and keeps your orders together. It only takes a minute.</p>
      <p className="signin-step__safe">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Your bag is saved on this device. Nothing is lost when you sign in, and you will come straight back to checkout.</span>
      </p>
      <div className="signin-step__actions">
        <ButtonLink href={authHref("login", next)} size="lg" block onClick={onNavigate}>Sign in</ButtonLink>
        <ButtonLink href={authHref("signup", next)} variant="outline" size="lg" block onClick={onNavigate}>Create account</ButtonLink>
        <div className="or-divider">or</div>
        <ButtonLink href={`/api/auth/google?next=${encodeURIComponent(next)}`} variant="google" size="lg" block>
          <GoogleMark /> Continue with Google
        </ButtonLink>
      </div>
      <Button variant="light" onClick={onBack} block>Keep shopping</Button>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
