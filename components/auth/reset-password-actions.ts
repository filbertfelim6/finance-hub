"use server";

import { cookies } from "next/headers";

export async function clearResetCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("pw_reset_pending");
}
