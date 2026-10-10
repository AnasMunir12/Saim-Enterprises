// Friendly messages for the ?error= codes set by the Google OAuth routes.
const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet. Please use your email and password for now.",
  google_denied: "Google sign-in was cancelled. You can try again or use your email and password.",
  google_state: "Your Google sign-in session expired or was invalid. Please try again.",
  google_unverified: "Your Google email address isn't verified, so we can't sign you in with it.",
  google_suspended: "This account has been suspended. Please contact Saim Enterprises for help.",
  google_failed: "We couldn't sign you in with Google. Please try again.",
};

export function authErrorMessage(code: string | undefined) {
  return code ? (GOOGLE_ERRORS[code] ?? "Something went wrong signing you in. Please try again.") : "";
}
