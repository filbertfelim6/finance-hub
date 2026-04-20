import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({ error: null, data: { user: {} } }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("RegisterForm", () => {
  it("renders email and password fields", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows success message after registration", async () => {
    render(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });
});
