"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const COOLDOWN = 60;
const LS_KEY = "pw_reset_sent_at";

const schema = z.object({
  email: z.email({ error: "Invalid email" }),
});

type Values = z.infer<typeof schema>;

function getStoredCooldown(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return 0;
    const elapsed = Math.floor((Date.now() - Number(raw)) / 1000);
    return Math.max(0, COOLDOWN - elapsed);
  } catch {
    return 0;
  }
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(() => {
    if (typeof window === "undefined") return false;
    return getStoredCooldown() > 0;
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window === "undefined") return 0;
    return getStoredCooldown();
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown > 0) runTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function startCooldown() {
    localStorage.setItem(LS_KEY, String(Date.now()));
    setCooldown(COOLDOWN);
    runTimer();
  }

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    setServerError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const isOAuthAccount =
          msg.includes("provider") ||
          msg.includes("oauth") ||
          msg.includes("identity") ||
          msg.includes("recovery email");
        setServerError(
          isOAuthAccount
            ? "This email is linked to a Google account. Please sign in with Google instead."
            : (error.message || "Something went wrong. Please try again.")
        );
      } else {
        setSent(true);
        startCooldown();
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div role="status" className="text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If that address is registered, a reset link is on its way.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={loading || cooldown > 0}
            >
              {loading
                ? "Sending…"
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend email"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <Logo className="h-9 w-auto mx-auto" />
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
