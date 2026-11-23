import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { LANGUAGE_STORAGE_KEY } from "./i18n";
import { sampleData } from "./test-fixtures";
import type { FileRepository } from "./storage";

const repository: FileRepository = {
  supported: true,
  open: async () => ({
    data: sampleData(),
    file: { name: "savings.json", save: async () => {} },
  }),
  create: async () => ({ name: "savings.json", save: async () => {} }),
};

describe("language selection", () => {
  it("translates existing notices, dates and amounts, and remembers the selection without changing savings", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App repository={repository} />);
    expect(
      screen.getByRole("link", { name: "cgb-my-savings home" }),
    ).toHaveTextContent("cgb-my-savings");
    await user.click(screen.getByRole("button", { name: "Open JSON" }));
    await screen.findByText("Opened savings.json.");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "es",
    );
    expect(document.documentElement.lang).toBe("es");
    expect(document.title).toBe("cgb-my-savings — Tu progreso, mes a mes");
    expect(
      screen.getByRole("link", { name: "Inicio de cgb-my-savings" }),
    ).toHaveTextContent("cgb-my-savings");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Se ha abierto savings.json.",
    );
    const overview = screen.getByRole("region", { name: "Resumen de ahorros" });
    expect(within(overview).getByText("330,00 €")).toBeInTheDocument();
    expect(
      within(overview).getByText("A fecha de febrero de 2026"),
    ).toBeInTheDocument();
    expect(
      within(overview).getByText("10,0 % respecto al mes anterior"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Todos los cambios guardados/)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Bank account" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
    unmount();
    render(<App repository={repository} />);
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(
      screen.getByRole("button", { name: "Guardar JSON" }),
    ).toBeInTheDocument();
  });

  it("keeps a draft and retranslates validation when switching in either direction", async () => {
    const user = userEvent.setup();
    render(<App repository={repository} />);
    await user.type(screen.getByLabelText("Predicted value"), "-2");
    await user.click(screen.getByRole("button", { name: "Add month" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use a positive amount or zero",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "es",
    );
    expect(screen.getByLabelText("Valor previsto")).toHaveValue("-2");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Introduce un importe positivo o cero",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Idioma" }),
      "en",
    );
    expect(screen.getByLabelText("Predicted value")).toHaveValue("-2");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use a positive amount or zero",
    );
  });

  it("uses Spanish browser preferences before a language is saved", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-MX", "en-US"]);
    render(<App repository={repository} />);
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(
      screen.getByRole("button", { name: "Añadir mes" }),
    ).toBeInTheDocument();
  });

  it("keeps the language change for this session and warns when preference storage is blocked", async () => {
    const user = userEvent.setup();
    render(<App repository={repository} />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "es",
    );
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "no se ha podido guardar la preferencia",
    );
  });

  it("uses the browser language and warns when the saved preference cannot be read", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-ES"]);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    render(<App repository={repository} />);
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se ha podido leer tu preferencia",
    );
  });
});
