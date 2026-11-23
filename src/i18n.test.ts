import { describe, expect, it } from "vitest";
import { AppError, detectLanguage } from "./i18n";
import { money, monthLabel, signedMoney } from "./model";
import { errorMessage } from "./storage";

describe("internationalization", () => {
  it("uses the first supported browser language and falls back to English", () => {
    expect(detectLanguage(["fr-FR", "es-MX", "en-US"])).toBe("es");
    expect(detectLanguage(["en-GB", "es-ES"])).toBe("en");
    expect(detectLanguage(["de-DE"])).toBe("en");
    expect(detectLanguage([])).toBe("en");
  });

  it("formats the same EUR cents and month according to the selected language", () => {
    expect(money(1_234_567, "en")).toBe("€12,345.67");
    expect(money(1_234_567, "es")).toBe("12.345,67\u00a0€");
    expect(signedMoney(12_345, "es")).toBe("+123,45\u00a0€");
    expect(monthLabel("2026-01", false, "en")).toBe("January 2026");
    expect(monthLabel("2026-01", false, "es")).toBe("enero de 2026");
  });

  it("localizes domain and browser errors without losing unexpected error details", () => {
    expect(errorMessage(new AppError("errorInvalidJson"), "es")).toContain(
      "no contiene un JSON válido",
    );
    expect(errorMessage(new AppError("errorExternalChange"), "es")).toContain(
      "ha cambiado fuera",
    );
    expect(
      errorMessage(new DOMException("Denied", "NotAllowedError"), "es"),
    ).toContain("Se ha denegado el acceso");
    expect(errorMessage(new Error("Disk failure"), "es")).toContain(
      "Detalles: Disk failure",
    );
  });
});
