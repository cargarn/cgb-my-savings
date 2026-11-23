import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PwaControls from "./PwaControls";

function installEvent(
  prompt = vi.fn(async () => {}),
  outcome: "accepted" | "dismissed" = "dismissed",
) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.defineProperties(event, {
    prompt: { value: prompt },
    userChoice: { value: Promise.resolve({ outcome }) },
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
}

describe("PWA installation controls", () => {
  it("shows manual installation guidance and translates it when the language changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PwaControls language="en" />);
    await user.click(screen.getByRole("button", { name: "Install app" }));
    expect(
      screen.getByText(/In Chrome on Android, open the menu/),
    ).toBeInTheDocument();
    rerender(<PwaControls language="es" />);
    expect(
      screen.getByText(/En Chrome para Android, abre el menú/),
    ).toBeInTheDocument();
  });

  it("uses the browser prompt and does not claim installation after dismissal", async () => {
    const user = userEvent.setup();
    render(<PwaControls language="en" />);
    const prompt = installEvent();
    await user.click(screen.getByRole("button", { name: "Install app" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    expect(screen.queryByText("App installed")).not.toBeInTheDocument();
  });

  it("waits for the browser's installed event before showing successful installation", async () => {
    const user = userEvent.setup();
    render(<PwaControls language="es" />);
    installEvent(undefined, "accepted");
    await user.click(
      screen.getByRole("button", { name: "Instalar aplicación" }),
    );
    expect(screen.queryByText("Aplicación instalada")).not.toBeInTheDocument();
    fireEvent(window, new Event("appinstalled"));
    expect(screen.getByText("Aplicación instalada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Instalar aplicación" }),
    ).not.toBeInTheDocument();
  });

  it("surfaces and retranslates installation failures", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PwaControls language="en" />);
    installEvent(
      vi.fn(async () => {
        throw new Error("Install unavailable");
      }),
    );
    await user.click(screen.getByRole("button", { name: "Install app" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Installation failed",
    );
    rerender(<PwaControls language="es" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La instalación ha fallado",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Install unavailable");
  });
});
