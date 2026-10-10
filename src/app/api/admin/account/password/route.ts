import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";
import { validateNewPassword } from "@/lib/password-policy";
import { rateLimit } from "@/lib/rate-limit";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const text = (value: unknown) => (typeof value === "string" ? value : "");

// The signed-in admin changes their own password. The current password is required, every older session
// (including other browsers) is signed out, and this browser is signed straight back in.
export const POST = adminRoute("change the password", async ({ request, admin }) => {
  if (!rateLimit(`admin-password:${admin.id}`, 10, 60 * 60 * 1000)) throw new ApiError("Too many attempts. Please try again later.", 429);

  const body = await readJsonObject(request);
  const currentPassword = text(body.currentPassword);
  const newPassword = text(body.newPassword);
  const confirmPassword = text(body.confirmPassword);
  if (!currentPassword || !newPassword || !confirmPassword) throw new ApiError("All fields are required.");

  const user = await User.findById(admin.id).select("passwordHash role");
  if (!user || user.role !== "admin") throw new ApiError("Unauthorized.", 401);
  if (!user.passwordHash) throw new ApiError("This account has no password to change.");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new ApiError("Your current password is incorrect.", 403);

  const problem = validateNewPassword(newPassword);
  if (problem) throw new ApiError(problem);
  if (newPassword !== confirmPassword) throw new ApiError("The new passwords do not match.");
  if (newPassword === currentPassword) throw new ApiError("Choose a password different from the current one.");

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  // A fresh session is issued after passwordChangedAt, so only this browser stays signed in.
  await setSessionCookie(String(user._id), "admin");
  return ok({ message: "Your password has been changed." });
});
