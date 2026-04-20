import { describe, it, expect } from "vitest";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/callback",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

describe("middleware path matching", () => {
  it("marks auth paths as public", () => {
    expect(isPublicPath("/auth/login")).toBe(true);
    expect(isPublicPath("/auth/register")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("marks app paths as protected", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/accounts")).toBe(false);
    expect(isPublicPath("/transactions")).toBe(false);
    expect(isPublicPath("/log")).toBe(false);
  });
});
