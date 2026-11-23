import { describe, expect, it } from "vitest";
import {
  actualTotal,
  monthlyChange,
  parseAmount,
  parseSavings,
  previousMonth,
  upsertSnapshot,
} from "./model";
import { sampleData } from "./test-fixtures";

describe("monthly savings", () => {
  it("stores decimal input as exact cents, including comma decimals and explicit zero", () => {
    expect(parseAmount("123.45")).toBe(12_345);
    expect(parseAmount("0,29")).toBe(29);
    expect(parseAmount("0")).toBe(0);
    expect(parseAmount("")).toBeNull();
    for (const invalid of ["-2", "1.001", "1e3", "abc", "10000000000.01"]) {
      expect(() => parseAmount(invalid)).toThrow();
    }
  });

  it("does not count missing balances as zero or compare against nonconsecutive months", () => {
    const data = sampleData();
    expect(actualTotal(data, data.snapshots[1])).toBe(33_000);
    expect(monthlyChange(data, data.snapshots[1])).toBe(3_000);
    expect(actualTotal(data, data.snapshots[2])).toBeNull();
    const partial = { month: "2026-03", balances: { bank: 0 }, predicted: 0 };
    expect(actualTotal(data, partial)).toBeNull();
    const zero = { ...partial, balances: { bank: 0, cash: 0 } };
    expect(actualTotal(data, zero)).toBe(0);
    const gap = { ...zero, month: "2026-05" };
    expect(monthlyChange(data, gap)).toBeNull();
    expect(previousMonth("2026-01")).toBe("2025-12");
  });

  it("uses the shared source list for every month, including newly added sources in history", () => {
    const data = sampleData();
    data.sources.push({ id: "fund", name: "Fund" });
    expect(actualTotal(data, data.snapshots[1])).toBeNull();
    expect(
      actualTotal(data, {
        month: "2025-12",
        balances: { bank: 0, cash: 0, fund: 100 },
        predicted: null,
      }),
    ).toBe(100);
  });

  it("reads legacy categories with a first month but makes them globally available", () => {
    const data = sampleData();
    const legacy = {
      ...data,
      sources: data.sources.map((source, index) => ({
        ...source,
        startMonth: index === 0 ? "2026-03" : "2026-01",
      })),
    };
    const parsed = parseSavings(JSON.stringify(legacy));
    expect(parsed.sources[0]).toEqual({ id: "bank", name: "Bank account" });
    expect(parsed.snapshots[0].balances.bank).toBe(10_000);
  });

  it("replaces a monthly snapshot rather than duplicating it and sorts historical additions", () => {
    const original = sampleData();
    const updated = upsertSnapshot(original, {
      month: "2026-02",
      balances: { bank: 50, cash: 50 },
      predicted: null,
    });
    expect(updated.snapshots).toHaveLength(3);
    expect(actualTotal(updated, updated.snapshots[1])).toBe(100);
    expect(original.snapshots[1].balances.bank).toBe(11_000);
    const earlier = upsertSnapshot(updated, {
      month: "2025-12",
      balances: {},
      predicted: 0,
    });
    expect(earlier.snapshots[0].month).toBe("2025-12");
  });

  it("round-trips JSON, preserving predictions without actual balances", () => {
    expect(parseSavings(JSON.stringify(sampleData()))).toEqual(sampleData());
  });

  it("rejects malformed, incompatible, ambiguous, or unsafe financial files", () => {
    expect(() => parseSavings("not json")).toThrow("not valid JSON");
    const data = sampleData();
    const invalidFiles: unknown[] = [
      { ...data, version: 2 },
      { ...data, currency: "USD" },
      { ...data, sources: [...data.sources, data.sources[0]] },
      { ...data, snapshots: [...data.snapshots, data.snapshots[0]] },
      {
        ...data,
        snapshots: [{ month: "2026-13", balances: {}, predicted: null }],
      },
      {
        ...data,
        snapshots: [
          { month: "2026-01", balances: { bank: 1.2 }, predicted: null },
        ],
      },
      {
        ...data,
        snapshots: [
          { month: "2026-01", balances: { unknown: 100 }, predicted: null },
        ],
      },
      {
        ...data,
        snapshots: [{ month: "2026-01", balances: {}, predicted: -1 }],
      },
      {
        ...data,
        snapshots: [
          {
            month: "2026-01",
            balances: {},
            predicted: Number.MAX_SAFE_INTEGER,
          },
        ],
      },
    ];
    for (const invalid of invalidFiles) {
      expect(() => parseSavings(JSON.stringify(invalid))).toThrow(
        "not a supported cgb-my-savings file",
      );
    }
  });
});
