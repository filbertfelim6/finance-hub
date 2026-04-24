import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTransactions, createTransaction, createTransfer, deleteTransaction } from "@/lib/queries/transactions";

const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

// Helper to create chainable query object
const createChainableObj = () => ({
  eq: mockEq,
  order: mockOrder,
  gte: mockGte,
  lte: mockLte,
  limit: mockLimit,
  single: mockSingle,
  then: undefined as any, // Will be set by tests
});

mockOrder.mockImplementation(() => createChainableObj());
mockEq.mockImplementation(() => createChainableObj());
mockGte.mockImplementation(() => createChainableObj());
mockLte.mockImplementation(() => createChainableObj());
mockLimit.mockImplementation(() => createChainableObj());
mockSelect.mockImplementation(() => createChainableObj());
mockDelete.mockImplementation(() => ({ eq: mockEq }));
mockFrom.mockImplementation(() => ({ select: mockSelect, delete: mockDelete }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc } as any),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset implementations after clearAllMocks
  mockOrder.mockImplementation(() => createChainableObj());
  mockEq.mockImplementation(() => createChainableObj());
  mockGte.mockImplementation(() => createChainableObj());
  mockLte.mockImplementation(() => createChainableObj());
  mockLimit.mockImplementation(() => createChainableObj());
  mockSelect.mockImplementation(() => createChainableObj());
  mockDelete.mockImplementation(() => ({ eq: mockEq }));
  mockFrom.mockImplementation(() => ({ select: mockSelect, delete: mockDelete }));
});

describe("getTransactions", () => {
  it("fetches transactions for an account", async () => {
    const txns = [{ id: "t1", account_id: "a1" }];
    let orderCallCount = 0;
    let lastQueryObject: any;

    mockOrder.mockImplementation(() => {
      orderCallCount++;
      const queryObject = createChainableObj() as any;
      if (orderCallCount === 2) {
        // Store reference so we can hook into subsequent calls
        lastQueryObject = queryObject;
        queryObject.then = (resolve: any, reject: any) => {
          const value = { data: txns, error: null };
          resolve(value);
          return Promise.resolve(value);
        };
      }
      return queryObject;
    });

    mockEq.mockImplementation(() => {
      // If this is called on our lastQueryObject, pass through to it
      if (lastQueryObject) {
        return lastQueryObject;
      }
      return createChainableObj();
    });

    const result = await getTransactions({ accountId: "a1" });
    expect(result).toEqual(txns);
  });

  it("throws on error", async () => {
    let orderCallCount = 0;
    mockOrder.mockImplementation(() => {
      orderCallCount++;
      const queryObject = createChainableObj() as any;
      if (orderCallCount === 2) {
        queryObject.then = (resolve: any, reject: any) => {
          reject(new Error("db error"));
        };
      }
      return queryObject;
    });
    await expect(getTransactions()).rejects.toThrow("db error");
  });
});

describe("createTransaction", () => {
  it("calls rpc with correct params", async () => {
    const txn = { id: "t1" };
    mockRpc.mockResolvedValueOnce({ data: [txn], error: null });
    const result = await createTransaction({
      account_id: "a1",
      type: "expense",
      amount: 100,
      balance_delta: -100,
      currency: "USD",
      converted_amount_usd: 100,
      category_id: "c1",
      notes: null,
      date: "2026-04-23",
    });
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transaction_with_balance",
      expect.objectContaining({ p_account_id: "a1", p_type: "expense" })
    );
    expect(result).toEqual(txn);
  });

  it("throws on rpc error", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("rpc error") });
    await expect(
      createTransaction({
        account_id: "a1",
        type: "income",
        amount: 500,
        balance_delta: 500,
        currency: "IDR",
        converted_amount_usd: null,
        category_id: null,
        notes: null,
        date: "2026-04-23",
      })
    ).rejects.toThrow("rpc error");
  });
});

describe("deleteTransaction", () => {
  it("deletes by id", async () => {
    mockEq.mockResolvedValueOnce({ error: null });
    await deleteTransaction("t1");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "t1");
  });
});
