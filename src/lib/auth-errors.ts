const AUTH_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "This email is already in use. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/user-not-found": "No account found with this email.",
  "auth/invalid-credential": "Invalid email or password. Please check and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Connection issue. Please check your network and try again.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
};

export function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  return (code && AUTH_MESSAGES[code]) || "Something went wrong. Please try again.";
}
