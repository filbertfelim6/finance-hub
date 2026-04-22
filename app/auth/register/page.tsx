import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <RegisterForm />
    </main>
  );
}
