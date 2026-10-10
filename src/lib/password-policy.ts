// Shared password rules for signup and password reset. Returns an error message, or null when valid.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = "At least 8 characters, with at least one letter and one number.";

export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }

  // bcrypt only uses the first 72 bytes; reject longer input instead of silently truncating.
  if (Buffer.byteLength(password) > 72) {
    return "Password is too long (72 characters maximum).";
  }

  return null;
}
