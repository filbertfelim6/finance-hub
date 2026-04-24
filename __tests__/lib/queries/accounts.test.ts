import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccounts, getAccount, createAccount, updateAccount, archiveAccount } from "@/lib/queries/accounts";

const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq, select: mockSelect }));
const mockSelect = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc } as any),
}));

beforeEach(() => vi.clearAllMocks());

describe("getAccounts", () => {
  it("returns active accounts ordered by created_at", async () => {
    const accounts = [{ id: "1", name: "BCA", is_archived: false }];
    mockOrder.mockResolvedValueOnce({ data: accounts, error: null });
    const result = await getAccounts();
    expect(result).toEqual(accounts);
    expect(mockFrom).toHaveBeenCalledWith("accounts");
  });

  it("throws on error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error("db error") });
    await expect(getAccounts()).rejects.toThrow("db error");
  });
});

describe("archiveAccount", () => {
  it("sets is_archived true for the given id", async () => {
    mockEq.mockReturnValueOnce({ error: null } as any);
    await archiveAccount("abc");
    expect(mockUpdate).toHaveBeenCalledWith({ is_archived: true });
    expect(mockEq).toHaveBeenCalledWith("id", "abc");
  });
});

describe("getAccount", () => {
  it("fetches a single account by id", async () => {
    const account = { id: "1", name: "BCA" };
    mockSingle.mockResolvedValueOnce({ data: account, error: null });
    const result = await getAccount("1");
    expect(result).toEqual(account);
    expect(mockEq).toHaveBeenCalledWith("id", "1");
  });

  it("throws on error", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("not found") });
    await expect(getAccount("bad")).rejects.toThrow("not found");
  });
});

describe("createAccount", () => {
  it("skips RPC when initialBalance is 0", async () => {
    const account = { id: "a1", name: "Cash" };
    mockSingle
      .mockResolvedValueOnce({ data: account, error: null }) // insert
      .mockResolvedValueOnce({ data: account, error: null }); // getAccount
    await createAccount(
      { name: "Cash", type: "cash", currency: "USD", initialBalance: 0, color: "#fff", icon: "wallet" },
      16000
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calls RPC when initialBalance > 0", async () => {
    const account = { id: "a1", name: "BCA" };
    mockSingle
      .mockResolvedValueOnce({ data: account, error: null }) // insert
      .mockResolvedValueOnce({ data: account, error: null }); // getAccount
    mockRpc.mockResolvedValueOnce({ data: [account], error: null });
    await createAccount(
      { name: "BCA", type: "checking", currency: "IDR", initialBalance: 1000000, color: "#blue", icon: "bank" },
      16000
    );
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transaction_with_balance",
      expect.objectContaining({ p_is_opening_balance: true, p_amount: 1000000 })
    );
  });
});

describe("updateAccount", () => {
  it("updates account fields and returns updated account", async () => {
    const account = { id: "1", name: "Updated" };
    mockSingle.mockResolvedValueOnce({ data: account, error: null });
    const result = await updateAccount("1", { name: "Updated" });
    expect(result).toEqual(account);
    expect(mockUpdate).toHaveBeenCalledWith({ name: "Updated" });
  });
});
