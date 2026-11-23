import { AppError } from "./i18n";

export interface PwaState {
  offlineReady: boolean;
  updateAvailable: boolean;
  error: unknown;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isInstallPrompt(event: Event): event is InstallPromptEvent {
  return (
    "prompt" in event &&
    typeof event.prompt === "function" &&
    "userChoice" in event
  );
}

export function watchOfflineApp(
  onChange: (change: Partial<PwaState>) => void,
): () => void {
  let stopped = false;
  const cleanups: (() => void)[] = [];
  const report = (change: Partial<PwaState>) => {
    if (!stopped) onChange(change);
  };
  const controller = navigator.serviceWorker;
  if (!window.isSecureContext || !controller) {
    report({ error: new AppError("errorPwaContext") });
    return () => {
      stopped = true;
    };
  }
  const controllerChanged = () => {
    if (controller.controller) report({ offlineReady: true });
  };
  controller.addEventListener("controllerchange", controllerChanged);
  cleanups.push(() =>
    controller.removeEventListener("controllerchange", controllerChanged),
  );
  const connect = async () => {
    const existing = await controller.getRegistration(import.meta.env.BASE_URL);
    if (existing?.active) report({ offlineReady: true });
    if (!navigator.onLine && existing) return existing;
    return controller.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    });
  };
  void connect()
    .then((registration) => {
      if (stopped) return;
      if (registration.active) report({ offlineReady: true });
      if (registration.waiting) report({ updateAvailable: true });
      const watchWorker = (worker: ServiceWorker) => {
        let activated = worker.state === "activated";
        const changed = () => {
          if (worker.state === "installed" && registration.active)
            report({ updateAvailable: true });
          if (worker.state === "activated") {
            activated = true;
            report({ offlineReady: true });
          }
          if (worker.state === "redundant" && !activated)
            report({ error: new AppError("errorPwaCache") });
        };
        worker.addEventListener("statechange", changed);
        cleanups.push(() => worker.removeEventListener("statechange", changed));
        changed();
      };
      const updateFound = () => {
        if (registration.installing) watchWorker(registration.installing);
      };
      registration.addEventListener("updatefound", updateFound);
      cleanups.push(() =>
        registration.removeEventListener("updatefound", updateFound),
      );
      if (registration.installing) watchWorker(registration.installing);
    })
    .catch((error: unknown) => report({ error }));
  return () => {
    stopped = true;
    cleanups.forEach((cleanup) => cleanup());
  };
}
