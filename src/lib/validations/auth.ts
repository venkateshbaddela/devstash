export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateResetEmail(email?: string | null): {
  valid: boolean;
  error?: string;
  email: string;
} {
  const trimmed = email?.trim().toLowerCase() ?? "";
  if (!trimmed) {
    return { valid: false, error: "Please enter your email address.", email: "" };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address.", email: trimmed };
  }
  return { valid: true, email: trimmed };
}

export function validateResetPassword(
  password?: string | null,
  confirmPassword?: string | null
): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return {
      valid: false,
      error: password === undefined || password === null ? "Password is required." : "Please enter a new password.",
    };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 72) {
    return { valid: false, error: "Password cannot exceed 72 characters." };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match." };
  }
  return { valid: true };
}
