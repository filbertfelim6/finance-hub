import { cookies } from "next/headers";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const valid = cookieStore.has("pw_reset_pending");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      {valid ? (
        <ResetPasswordForm />
      ) : (
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has already been used.
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Request a new link
          </Link>
        </div>
      )}
    </main>
  );
}
