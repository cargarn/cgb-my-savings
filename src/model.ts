export interface Source {
  id: string;
  name: string;
}

export interface Snapshot {
  month: string;
  balances: Record<string, number>;
  predicted: number | null;
}

export interface SavingsData {
  version: 1;
  currency: "EUR";
  sources: Source[];
  snapshots: Snapshot[];
}

export const SOURCE_COLORS = [
  "#6558df",
  "#26a69a",
  "#f2b34d",
  "#dd79ae",
  "#719ddd",
  "#91b357",
];
const MAX_CENTS = 1_000_000_000_000;

export function emptyData(): SavingsData {
  return { version: 1, currency: "EUR", sources: [], snapshots: [] };
}

export function currentMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isMonth(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(value)
  );
}

export function previousMonth(month: string): string {
  const [year, value] = month.split("-").map(Number);
  if (value === 1) return `${year - 1}-12`;
  return `${year}-${String(value - 1).padStart(2, "0")}`;
}

export function monthLabel(
  month: string,
  short = false,
  language: Language = "en",
): string {
  return new Intl.DateTimeFormat(LOCALES[language], {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

export function money(cents: number, language: Language = "en"): string {
  return new Intl.NumberFormat(LOCALES[language], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function signedMoney(cents: number, language: Language = "en"): string {
  return `${cents > 0 ? "+" : ""}${money(cents, language)}`;
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim();
  if (normalized === "") return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(normalized)) {
    throw new AppError("errorAmount");
  }
  const [whole, fraction = ""] = normalized.replace(",", ".").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) {
    throw new AppError("errorAmountTooLarge");
  }
  return cents;
}

export function sourcesForMonth(data: SavingsData): Source[] {
  return data.sources;
}

export function actualTotal(
  data: SavingsData,
  snapshot: Snapshot,
): number | null {
  const sources = sourcesForMonth(data);
  if (
    !sources.length ||
    sources.some((source) => !Object.hasOwn(snapshot.balances, source.id))
  ) {
    return null;
  }
  return sources.reduce((sum, source) => sum + snapshot.balances[source.id], 0);
}

export function monthlyChange(
  data: SavingsData,
  snapshot: Snapshot,
): number | null {
  const prior = data.snapshots.find(
    (item) => item.month === previousMonth(snapshot.month),
  );
  const current = actualTotal(data, snapshot);
  const previous = prior ? actualTotal(data, prior) : null;
  if (current === null || previous === null) return null;
  return current - previous;
}

export function upsertSnapshot(
  data: SavingsData,
  snapshot: Snapshot,
): SavingsData {
  return {
    ...data,
    snapshots: [
      ...data.snapshots.filter((item) => item.month !== snapshot.month),
      snapshot,
    ].sort((a, b) => a.month.localeCompare(b.month)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validCents(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_CENTS
  );
}

export function parseSavings(text: string): SavingsData {
  let value: unknown;
  try {
    value = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    throw new AppError("errorInvalidJson");
  }
  const invalid = () => {
    throw new AppError("errorUnsupportedJson");
  };
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.currency !== "EUR" ||
    !Array.isArray(value.sources) ||
    !Array.isArray(value.snapshots)
  ) {
    return invalid();
  }
  const ids = new Set<string>();
  const names = new Set<string>();
  const sources: Source[] = value.sources.map((item: unknown) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      Object.hasOwn(Object.prototype, item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 60 ||
      ids.has(item.id) ||
      names.has(item.name.trim().toLowerCase())
    ) {
      return invalid();
    }
    ids.add(item.id);
    names.add(item.name.trim().toLowerCase());
    return { id: item.id, name: item.name.trim() };
  });
  const months = new Set<string>();
  const snapshots: Snapshot[] = value.snapshots.map((item: unknown) => {
    if (
      !isRecord(item) ||
      !isMonth(item.month) ||
      months.has(item.month) ||
      !isRecord(item.balances) ||
      (item.predicted !== null && !validCents(item.predicted))
    ) {
      return invalid();
    }
    const month = item.month;
    const entries = Object.entries(item.balances);
    const balances: Record<string, number> = {};
    for (const [id, balance] of entries) {
      if (
        !validCents(balance) ||
        !sources.some((source) => source.id === id)
      ) {
        return invalid();
      }
      balances[id] = balance;
    }
    if (
      !Number.isSafeInteger(
        entries.reduce((sum, [, balance]) => sum + Number(balance), 0),
      )
    ) {
      return invalid();
    }
    months.add(month);
    return {
      month,
      balances,
      predicted: item.predicted,
    };
  });
  return {
    version: 1,
    currency: "EUR",
    sources,
    snapshots: snapshots.sort((a, b) => a.month.localeCompare(b.month)),
  };
}
import { AppError, LOCALES, type Language } from "./i18n";
