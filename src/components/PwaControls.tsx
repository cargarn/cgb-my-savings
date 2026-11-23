import { useEffect, useState } from "react";
import { translator, type Language } from "../i18n";
import {
  isInstallPrompt,
  watchOfflineApp,
  type InstallPromptEvent,
  type PwaState,
} from "../pwa";
import { errorMessage } from "../storage";
import Icon from "./Icon";

export default function PwaControls({ language }: { language: Language }) {
  const t = translator(language);
  const [state, setState] = useState<PwaState>({
    offlineReady: false,
    updateAvailable: false,
    error: null,
  });
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.("(display-mode: standalone)").matches ?? false,
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<unknown>(null);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      if (!isInstallPrompt(event)) return;
      event.preventDefault();
      setPrompt(event);
    };
    const completed = () => {
      setInstalled(true);
      setPrompt(null);
      setShowInstructions(false);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", completed);
    let stop = () => {};
    if (import.meta.env.PROD) {
      stop = watchOfflineApp((change) =>
        setState((current) => ({ ...current, ...change })),
      );
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", completed);
      stop();
    };
  }, []);

  async function install() {
    if (!prompt) {
      setShowInstructions((value) => !value);
      return;
    }
    setInstalling(true);
    setInstallError(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      setInstallError(error);
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  let status = t("pwaPreparing");
  if (!import.meta.env.PROD) status = t("pwaDevelopment");
  if (state.offlineReady) status = t("pwaReady");
  return (
    <section className="pwa-panel" aria-label={t("pwaInstallation")}>
      <div className="pwa-summary">
        <span className="pwa-status" aria-live="polite">
          <Icon name={state.offlineReady ? "check" : "shield"} size={15} />
          {status}
        </span>
        {installed ? (
          <span className="pwa-installed">{t("pwaInstalled")}</span>
        ) : (
          <button
            type="button"
            className="text-button"
            disabled={installing}
            onClick={() => void install()}
          >
            {installing ? t("working") : t("pwaInstall")}
          </button>
        )}
      </div>
      {showInstructions && (
        <p className="pwa-instructions">{t("pwaInstructions")}</p>
      )}
      {state.updateAvailable && (
        <p className="pwa-update" aria-live="polite">
          {t("pwaUpdate")}
        </p>
      )}
      {state.error != null && (
        <p className="inline-error" role="alert">
          {t("pwaSetupError")} {errorMessage(state.error, language)}
        </p>
      )}
      {installError != null && (
        <p className="inline-error" role="alert">
          {t("pwaInstallError")} {errorMessage(installError, language)}
        </p>
      )}
    </section>
  );
}
