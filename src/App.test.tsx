import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { emptyData, type SavingsData } from "./model";
import type { FileRepository } from "./storage";
import { sampleData } from "./test-fixtures";

function memoryFiles(data = emptyData(), failSave = false) {
  const writes: SavingsData[] = [];
  const save = async (next: SavingsData) => {
    if (failSave)
      throw new Error("Permission denied. Please reopen the JSON file.");
    writes.push(structuredClone(next));
  };
  const file = { name: "savings.json", save };
  const repository: FileRepository = {
    supported: true,
    open: async () => ({ data: structuredClone(data), file }),
    create: async (next) => {
      await save(next);
      return file;
    },
  };
  return { repository, writes };
}

describe("savings dashboard", () => {
  it("creates a source, records cents and a prediction, then saves to JSON", async () => {
    const user = userEvent.setup();
    const { repository, writes } = memoryFiles();
    render(<App repository={repository} />);
    await user.click(
      screen.getByRole("button", { name: "Add savings source" }),
    );
    await user.type(screen.getByLabelText("Source name"), "Savings account");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add source",
      }),
    );
    await user.type(screen.getByLabelText("Savings account balance"), "123.45");
    await user.type(screen.getByLabelText("Predicted value"), "120");
    await user.click(screen.getByRole("button", { name: "Add month" }));
    expect(screen.getAllByText("€123.45").length).toBeGreaterThan(0);
    expect(screen.getByText("+€3.45 ahead of plan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save JSON" }));
    await screen.findByText("Saved to savings.json.");
    expect(writes).toHaveLength(1);
    expect(Object.values(writes[0].snapshots[0].balances)).toEqual([12_345]);
    expect(writes[0].snapshots[0].predicted).toBe(12_000);
  });

  it("opens historical data, compares complete months, filters sources, and corrects a snapshot", async () => {
    const user = userEvent.setup();
    const { repository, writes } = memoryFiles(sampleData());
    render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    const overview = screen.getByRole("region", { name: "Savings overview" });
    expect(within(overview).getByText("€330.00")).toBeInTheDocument();
    expect(within(overview).getByText("+€30.00")).toBeInTheDocument();
    expect(
      within(overview).getByText("-€10.00 behind plan"),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter savings source" }),
      "bank",
    );
    expect(
      screen.getByRole("columnheader", { name: "Source balance" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Edit February 2026" }),
    );
    await user.clear(screen.getByLabelText("Bank account balance"));
    await user.type(screen.getByLabelText("Bank account balance"), "120");
    await user.click(screen.getByRole("button", { name: "Update month" }));
    await user.click(screen.getByRole("button", { name: "Save JSON" }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].snapshots).toHaveLength(3);
    expect(writes[0].snapshots[1].balances.bank).toBe(12_000);
  });

  it("preserves drafts when adding a source and prevents saving unapplied values", async () => {
    const user = userEvent.setup();
    const { repository, writes } = memoryFiles();
    render(<App repository={repository} />);
    await user.type(screen.getByLabelText("Predicted value"), "500");
    await user.click(
      screen.getByRole("button", { name: "Add savings source" }),
    );
    await user.type(screen.getByLabelText("Source name"), "Cash");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add source",
      }),
    );
    expect(screen.getByLabelText("Predicted value")).toHaveValue("500");
    await user.click(screen.getByRole("button", { name: "Save JSON" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Apply your check-in");
    expect(writes).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Add month" }));
    expect(screen.getByText("0/1 balances entered")).toBeInTheDocument();
    expect(screen.queryByText("€0.00")).not.toBeInTheDocument();
  });

  it("filters an imported source named all without confusing it with the total view", async () => {
    const user = userEvent.setup();
    const data: SavingsData = {
      version: 1,
      currency: "EUR",
      sources: [
        { id: "all", name: "Bank", startMonth: "2026-01" },
        { id: "cash", name: "Cash", startMonth: "2026-01" },
      ],
      snapshots: [
        {
          month: "2026-01",
          balances: { all: 10_000, cash: 20_000 },
          predicted: 40_000,
        },
      ],
    };
    const { repository } = memoryFiles(data);
    render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter savings source" }),
      "all",
    );
    const row = screen.getByRole("row", { name: /Jan 2026/ });
    expect(
      within(row).getByRole("cell", { name: "€100.00" }),
    ).toBeInTheDocument();
    expect(within(row).queryByText("€400.00")).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Source balance" }),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter savings source" }),
      "",
    );
    expect(
      within(row).getByRole("cell", { name: "€300.00" }),
    ).toBeInTheDocument();
    expect(within(row).getByText("€400.00")).toBeInTheDocument();
  });

  it("explains an undefined percentage when the previous complete total was zero", async () => {
    const user = userEvent.setup();
    const data = sampleData();
    data.snapshots[0].balances = { bank: 0, cash: 0 };
    const { repository } = memoryFiles(data);
    render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    const overview = screen.getByRole("region", { name: "Savings overview" });
    expect(within(overview).getByText("+€330.00")).toBeInTheDocument();
    expect(
      within(overview).getByText(
        "Percentage unavailable: previous total was €0",
      ),
    ).toBeInTheDocument();
    expect(
      within(overview).queryByText("Needs two consecutive complete months"),
    ).not.toBeInTheDocument();
  });

  it("retains the current month and draft when switching is cancelled", async () => {
    const user = userEvent.setup();
    const confirmation = vi.fn(() => false);
    const { repository } = memoryFiles();
    render(<App repository={repository} confirmAction={confirmation} />);
    const month = screen.getByLabelText("Month");
    const initial = (month as HTMLInputElement).value;
    await user.type(screen.getByLabelText("Predicted value"), "500");
    fireEvent.change(month, { target: { value: "2025-01" } });
    expect(confirmation).toHaveBeenCalledOnce();
    expect(month).toHaveValue(initial);
    expect(screen.getByLabelText("Predicted value")).toHaveValue("500");
  });

  it("reports a write failure and leaves the changes unsaved", async () => {
    const user = userEvent.setup();
    const { repository } = memoryFiles(sampleData(), true);
    render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    await user.clear(screen.getByLabelText("Predicted value"));
    await user.type(screen.getByLabelText("Predicted value"), "450");
    await user.click(screen.getByRole("button", { name: "Update month" }));
    await user.click(screen.getByRole("button", { name: "Save JSON" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Permission denied",
    );
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
    expect(
      screen.queryByText("Saved to savings.json."),
    ).not.toBeInTheDocument();
  });

  it("confirms deletion before removing a month", async () => {
    const user = userEvent.setup();
    const { repository, writes } = memoryFiles(sampleData());
    render(<App repository={repository} confirmAction={() => true} />);
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    await user.click(screen.getByRole("button", { name: "Delete March 2026" }));
    expect(
      screen.queryByRole("button", { name: "Edit March 2026" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save JSON" }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].snapshots.map((snapshot) => snapshot.month)).toEqual([
      "2026-01",
      "2026-02",
    ]);
  });
});
