import type { SavingsData } from "./model";

export function sampleData(): SavingsData {
  return {
    version: 1,
    currency: "EUR",
    sources: [
      { id: "bank", name: "Bank account", startMonth: "2026-01" },
      { id: "cash", name: "Cash", startMonth: "2026-01" },
    ],
    snapshots: [
      {
        month: "2026-01",
        balances: { bank: 10_000, cash: 20_000 },
        predicted: 29_000,
      },
      {
        month: "2026-02",
        balances: { bank: 11_000, cash: 22_000 },
        predicted: 34_000,
      },
      { month: "2026-03", balances: {}, predicted: 40_000 },
    ],
  };
}
