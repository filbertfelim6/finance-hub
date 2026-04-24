import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccounts, getAccount, createAccount, updateAccount, archiveAccount } from "@/lib/queries/accounts";

const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq }));
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
  it("sets is_archived true", async () => {
    mockEq.mockReturnValueOnce({ error: null } as any);
    await archiveAccount("abc");
    expect(mockUpdate).toHaveBeenCalledWith({ is_archived: true });
  });
});
