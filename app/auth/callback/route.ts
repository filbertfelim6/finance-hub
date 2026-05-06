import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let exchangeError = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) exchangeError = false;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) exchangeError = false;
  }

  if (!exchangeError) {
    const response = NextResponse.redirect(`${origin}${next}`);
    if (next === "/auth/reset-password") {
      response.cookies.set("pw_reset_pending", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/auth/reset-password",
        maxAge: 600,
      });
    }
    return response;
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
