import { describe, it, expectTypeOf } from "vitest";
import type { Account, Transaction, Category } from "@/lib/types/database.types";

describe("database types", () => {
  it("Account has required fields", () => {
    expectTypeOf<Account>().toHaveProperty("id");
    expectTypeOf<Account>().toHaveProperty("balance");
    expectTypeOf<Account>().toHaveProperty("type");
  });

  it("Transaction has currency field", () => {
    expectTypeOf<Transaction>().toHaveProperty("currency");
    expectTypeOf<Transaction>().toHaveProperty("converted_amount_usd");
  });

  it("Category user_id can be null (system categories)", () => {
    expectTypeOf<Category["user_id"]>().toEqualTypeOf<string | null>();
  });
});
