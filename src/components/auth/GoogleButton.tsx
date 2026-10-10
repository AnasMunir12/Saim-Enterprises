import { GoogleMark } from "@/components/cart/SignInStep";
import { ButtonLink } from "@/components/ui/Button";

// Full-page navigation to an API route that redirects to Google, so it is a plain anchor (ButtonLink handles that).
export function GoogleButton({ label = "Continue with Google", next }: { label?: string; next?: string | null }) {
  return (
    <ButtonLink href={next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google"} variant="google" size="lg" block>
      <GoogleMark /> {label}
    </ButtonLink>
  );
}

export function OrDivider() {
  return <div className="or-divider">or</div>;
}
