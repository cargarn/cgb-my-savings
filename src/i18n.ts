export type Language = "en" | "es";
export const LANGUAGE_STORAGE_KEY = "mysavings.language";
export const LOCALES: Record<Language, string> = { en: "en-IE", es: "es-ES" };

const en = {
  documentTitle: "cgb-my-savings — Your progress, month by month",
  documentDescription: "A private, local-first view of your monthly savings.",
  language: "Language",
  home: "cgb-my-savings home",
  brandTagline: "SMALL STEPS. REAL PROGRESS.",
  privacyBadge: "Just you and your savings",
  pageEyebrow: "YOUR MONEY, IN PERSPECTIVE",
  pageTitle: "A clearer picture of your savings",
  pageSubtitle: "See where you are, how far you've come, and what's ahead.",
  openJson: "Open JSON",
  pasteJson: "Paste JSON",
  pasteJsonTitle: "Paste your savings JSON",
  pasteJsonDescription:
    "Paste the contents of a cgb-my-savings JSON file below. Your data stays on this device.",
  jsonContent: "JSON content",
  importJson: "Import JSON",
  closePasteJson: "Close paste JSON",
  saveJson: "Save JSON",
  working: "Working…",
  noFile: "No JSON file connected",
  unsaved: "Unsaved changes",
  allSaved: "All changes saved",
  startHint: "Open a file or start a new check-in",
  saveAs: "Save as new file",
  localOnly: "Local only",
  unsupportedTitle: "This browser does not support direct JSON file saving.",
  unsupportedDescription:
    "You can explore the interface here, but use a supported browser to save. No data is sent to a server.",
  privacyNotice:
    "Your financial data stays on this device. No account. No cloud. No tracking.",
  overview: "Savings overview",
  totalSavings: "Total savings",
  asOf: "As of {month}",
  latestBalance: "Your latest complete monthly balance",
  sourceCountOne: "{count} savings source",
  sourceCountOther: "{count} savings sources",
  monthlyChange: "Monthly change",
  needConsecutive: "Needs two consecutive complete months",
  zeroBaseline: "Percentage unavailable: previous total was €0",
  percentageChange: "{percentage} from the previous month",
  balanceNotContributions: "Balance change, not just contributions",
  changeComparison: "{amount} vs. the previous month’s change",
  predictedValue: "Predicted value",
  expectationFor: "Your expectation for {month}",
  expectedTotal: "Your expected end-of-month total",
  setPrediction: "Set a prediction to compare your progress",
  behindPlan: "{amount} behind plan",
  aheadOfPlan: "{amount} ahead of plan",
  savingsJourney: "Your savings journey",
  journeySubtitle: "A month-by-month view of your bigger picture.",
  filterSource: "Filter savings source",
  allSources: "All savings sources",
  addSavingsSource: "Add savings source",
  loadingChart: "Loading your chart…",
  chartNote:
    "Bars show complete monthly totals. The dashed line is your predicted total.",
  filteredChartNote:
    "Showing entered balances for this source. Predictions apply to all savings, so they are hidden.",
  history: "Monthly history",
  historySubtitle: "Your check-ins, all in one place.",
  monthCountOne: "{count} month",
  monthCountOther: "{count} months",
  consistencyTitle: "Consistency over perfection",
  consistencyDescription:
    "One check-in each month is all it takes to see the progress that’s easy to miss.",
  yourSources: "Your savings sources",
  sourcesEyebrow: "YOUR SOURCES",
  footerTagline: "A little more clarity, every month.",
  footerStorage: "Stored in your JSON file · EUR",
  pwaInstallation: "App installation and offline access",
  pwaInstall: "Install app",
  pwaInstalled: "App installed",
  pwaPreparing: "Preparing the app for offline use…",
  pwaDevelopment:
    "Offline installation is available in the production preview.",
  pwaReady: "App ready offline. Financial changes still need Save JSON.",
  pwaInstructions:
    "In Chrome on Android, open the menu (⋮) and choose Install app or Add to Home screen. First open the app over HTTPS, or localhost for USB testing. File saving also needs a browser with file-picker support.",
  pwaUpdate:
    "A new version is ready. Save your JSON file, then close every cgb-my-savings tab and app window. Reopen to use the update; this app will not reload you automatically.",
  pwaSetupError: "Offline setup failed.",
  pwaInstallError:
    "Installation failed. You can also try Chrome’s installation menu.",
  chartEmptyTitle: "Your progress starts here",
  chartEmptyDescription:
    "Add your first monthly check-in to see your savings grow.",
  historyCaption: "Monthly savings balances, predictions and changes",
  month: "Month",
  sourceBalance: "Source balance",
  versusPrediction: "Vs. prediction",
  actions: "Actions",
  enteredBalances: "{entered}/{expected} balances entered",
  incomplete: "Incomplete",
  notEntered: "Not entered",
  edit: "Edit",
  editMonth: "Edit {month}",
  historyEmpty: "No months yet. Your first check-in will appear here.",
  monthlyCheckIn: "Monthly check-in",
  checkInSubtitle: "A little update. A bigger picture.",
  yourBalances: "Your balances",
  addSource: "Add source",
  noSources: "No shared categories yet. Add one, or enter a prediction below.",
  balanceLabel: "{name} balance",
  balanceHelp:
    "Enter end-of-month balances, not deposits. Leave unknown balances blank; enter 0 for an empty account.",
  expectedSavings: "Expected total savings",
  predictionHelp:
    "One expected total across all sources. You can plan future months, too.",
  updateMonth: "Update month",
  addMonth: "Add month",
  deleteMonth: "Delete {month}",
  editorFootnote: "Changes stay in this tab until you save your JSON file.",
  savedPrediction: "Saved prediction: {amount}",
  sourceEyebrow: "A PLACE FOR EVERY PENNY",
  sourceDialogTitle: "Add a savings source",
  closeSource: "Close add source",
  sourceName: "Source name",
  sourcePlaceholder: "e.g. Savings account",
  cancel: "Cancel",
  confirmOpen: "Discard unsaved changes and open another JSON file?",
  confirmImport: "Discard unsaved changes and import pasted JSON?",
  confirmMonth: "Discard the unapplied check-in changes and switch months?",
  confirmDelete:
    "Delete all balances and the prediction for {month}? Save JSON afterward to make this permanent.",
  sourceAdded: "{name} added.",
  monthUpdated: "{month} updated.",
  monthDeleted: "Month deleted.",
  fileOpened: "Opened {name}.",
  jsonPasted: "Pasted JSON content.",
  fileSaved: "Saved to {name}.",
  saveReminder: "Save JSON to keep your changes.",
  errorApplyDraft:
    "Apply your check-in with Add month or Update month before saving JSON.",
  errorAmount:
    "Use a positive amount or zero, with at most two decimal places.",
  errorAmountTooLarge:
    "The amount is too large. Enter at most 10,000,000,000.00.",
  errorInvalidJson:
    "This file is not valid JSON. Your current data has not been changed.",
  errorUnsupportedJson:
    "This is not a supported cgb-my-savings file. Check its version, sources and monthly values.",
  errorExternalChange:
    "The JSON file changed outside this app. Save your changes to a new file, then reopen the original to review it.",
  errorBrowser:
    "Use a browser with file-picker support, such as desktop Chrome or Edge, or compatible Chrome for Android.",
  errorNoFile: "No JSON file was selected.",
  errorEmptyMonth: "Enter at least one balance or a predicted value.",
  errorSourceName: "Enter a name for your savings source.",
  errorDuplicateSource: "A source with that name already exists.",
  errorOperation:
    "The operation failed. Your changes are still in this tab; please try again.",
  errorOperationDetails:
    "The operation failed. Your changes are still in this tab. Details: {details}",
  errorPermission:
    "File access was denied. Reopen the JSON file and grant permission, then try again.",
  errorFileMissing:
    "The file could not be found. Save your changes to a new JSON file.",
  errorDiskSpace:
    "There is not enough storage space to save this file. Free some space and try again.",
  errorLanguageRead:
    "Your language preference could not be read. Using your browser's language for this session.",
  errorLanguageSave:
    "Your language has changed for this session, but the preference could not be saved on this device.",
  errorPwaContext:
    "Offline installation requires HTTPS (or localhost for testing) and a browser with service-worker support.",
  errorPwaCache:
    "The app files could not be fully cached. Reconnect and reopen the app before relying on offline access.",
};

const es: Record<keyof typeof en, string> = {
  documentTitle: "cgb-my-savings — Tu progreso, mes a mes",
  documentDescription: "Una visión privada y local de tus ahorros mensuales.",
  language: "Idioma",
  home: "Inicio de cgb-my-savings",
  brandTagline: "PEQUEÑOS PASOS. PROGRESO REAL.",
  privacyBadge: "Solo tú y tus ahorros",
  pageEyebrow: "TU DINERO, EN PERSPECTIVA",
  pageTitle: "Una visión más clara de tus ahorros",
  pageSubtitle:
    "Descubre dónde estás, cuánto has avanzado y qué viene después.",
  openJson: "Abrir JSON",
  pasteJson: "Pegar JSON",
  pasteJsonTitle: "Pega el JSON de tus ahorros",
  pasteJsonDescription:
    "Pega debajo el contenido de un archivo JSON de cgb-my-savings. Tus datos permanecen en este dispositivo.",
  jsonContent: "Contenido JSON",
  importJson: "Importar JSON",
  closePasteJson: "Cerrar pegar JSON",
  saveJson: "Guardar JSON",
  working: "Procesando…",
  noFile: "Ningún archivo JSON conectado",
  unsaved: "Cambios sin guardar",
  allSaved: "Todos los cambios guardados",
  startHint: "Abre un archivo o añade tu primer registro",
  saveAs: "Guardar en un archivo nuevo",
  localOnly: "Solo en tu dispositivo",
  unsupportedTitle:
    "Este navegador no permite guardar archivos JSON directamente.",
  unsupportedDescription:
    "Puedes explorar la interfaz aquí, pero usa un navegador compatible para guardar. No se envían datos a ningún servidor.",
  privacyNotice:
    "Tus datos financieros se quedan en este dispositivo. Sin cuenta. Sin nube. Sin seguimiento.",
  overview: "Resumen de ahorros",
  totalSavings: "Ahorros totales",
  asOf: "A fecha de {month}",
  latestBalance: "Tu último saldo mensual completo",
  sourceCountOne: "{count} origen de ahorro",
  sourceCountOther: "{count} orígenes de ahorro",
  monthlyChange: "Variación mensual",
  needConsecutive: "Se necesitan dos meses completos consecutivos",
  zeroBaseline: "Porcentaje no disponible: el total anterior era de 0 €",
  percentageChange: "{percentage} respecto al mes anterior",
  balanceNotContributions: "Variación del saldo, no solo aportaciones",
  changeComparison: "{amount} respecto a la variación del mes anterior",
  predictedValue: "Valor previsto",
  expectationFor: "Tu previsión para {month}",
  expectedTotal: "Tu total previsto al cierre del mes",
  setPrediction: "Añade una previsión para comparar tu progreso",
  behindPlan: "{amount} por debajo de lo previsto",
  aheadOfPlan: "{amount} por encima de lo previsto",
  savingsJourney: "La evolución de tus ahorros",
  journeySubtitle: "Una visión de tu progreso, mes a mes.",
  filterSource: "Filtrar origen de ahorro",
  allSources: "Todos los orígenes",
  addSavingsSource: "Añadir origen de ahorro",
  loadingChart: "Cargando tu gráfico…",
  chartNote:
    "Las barras muestran los totales mensuales completos. La línea discontinua es tu total previsto.",
  filteredChartNote:
    "Se muestran los saldos registrados de este origen. Las previsiones corresponden al total y se ocultan.",
  history: "Historial mensual",
  historySubtitle: "Todos tus registros en un solo lugar.",
  monthCountOne: "{count} mes",
  monthCountOther: "{count} meses",
  consistencyTitle: "La constancia antes que la perfección",
  consistencyDescription:
    "Un registro al mes basta para ver ese progreso que suele pasar desapercibido.",
  yourSources: "Tus orígenes de ahorro",
  sourcesEyebrow: "TUS ORÍGENES",
  footerTagline: "Un poco más de claridad, cada mes.",
  footerStorage: "Guardado en tu archivo JSON · EUR",
  pwaInstallation: "Instalación y acceso sin conexión",
  pwaInstall: "Instalar aplicación",
  pwaInstalled: "Aplicación instalada",
  pwaPreparing: "Preparando la aplicación para usarla sin conexión…",
  pwaDevelopment:
    "La instalación sin conexión está disponible en la vista previa de producción.",
  pwaReady:
    "Aplicación lista sin conexión. Los cambios financieros aún requieren Guardar JSON.",
  pwaInstructions:
    "En Chrome para Android, abre el menú (⋮) y elige Instalar aplicación o Añadir a pantalla de inicio. Abre primero la aplicación mediante HTTPS, o localhost para pruebas por USB. Para guardar archivos también necesitas un navegador con selector de archivos.",
  pwaUpdate:
    "Hay una nueva versión lista. Guarda tu archivo JSON y cierra todas las pestañas y ventanas de cgb-my-savings. Vuelve a abrir la aplicación para actualizarla; nunca se recargará automáticamente.",
  pwaSetupError: "No se ha podido preparar el acceso sin conexión.",
  pwaInstallError:
    "La instalación ha fallado. También puedes usar el menú de instalación de Chrome.",
  chartEmptyTitle: "Tu progreso empieza aquí",
  chartEmptyDescription:
    "Añade tu primer registro mensual para ver cómo evolucionan tus ahorros.",
  historyCaption: "Saldos, previsiones y variaciones mensuales de tus ahorros",
  month: "Mes",
  sourceBalance: "Saldo del origen",
  versusPrediction: "Frente a la previsión",
  actions: "Acciones",
  enteredBalances: "{entered}/{expected} saldos registrados",
  incomplete: "Incompleto",
  notEntered: "Sin registrar",
  edit: "Editar",
  editMonth: "Editar {month}",
  historyEmpty: "Aún no hay meses. Tu primer registro aparecerá aquí.",
  monthlyCheckIn: "Registro mensual",
  checkInSubtitle: "Una pequeña actualización. Una visión más amplia.",
  yourBalances: "Tus saldos",
  addSource: "Añadir origen",
  noSources:
    "Aún no hay categorías compartidas. Añade una o introduce una previsión más abajo.",
  balanceLabel: "Saldo de {name}",
  balanceHelp:
    "Introduce saldos al cierre del mes, no aportaciones. Deja en blanco los saldos desconocidos; escribe 0 si la cuenta está vacía.",
  expectedSavings: "Total de ahorros previsto",
  predictionHelp:
    "Un único total previsto para todos los orígenes. También puedes planificar meses futuros.",
  updateMonth: "Actualizar mes",
  addMonth: "Añadir mes",
  deleteMonth: "Eliminar {month}",
  editorFootnote:
    "Los cambios se quedan en esta pestaña hasta que guardes tu archivo JSON.",
  savedPrediction: "Previsión guardada: {amount}",
  sourceEyebrow: "UN LUGAR PARA CADA CÉNTIMO",
  sourceDialogTitle: "Añadir un origen de ahorro",
  closeSource: "Cerrar formulario de origen",
  sourceName: "Nombre del origen",
  sourcePlaceholder: "p. ej., Cuenta de ahorro",
  cancel: "Cancelar",
  confirmOpen: "¿Descartar los cambios sin guardar y abrir otro archivo JSON?",
  confirmImport:
    "¿Descartar los cambios sin guardar e importar el JSON pegado?",
  confirmMonth:
    "¿Descartar los cambios del registro sin aplicar y cambiar de mes?",
  confirmDelete:
    "¿Eliminar todos los saldos y la previsión de {month}? Guarda el JSON después para que sea permanente.",
  sourceAdded: "Se ha añadido {name}.",
  monthUpdated: "Se ha actualizado {month}.",
  monthDeleted: "Mes eliminado.",
  fileOpened: "Se ha abierto {name}.",
  jsonPasted: "Se ha pegado el contenido JSON.",
  fileSaved: "Guardado en {name}.",
  saveReminder: "Guarda el JSON para conservar tus cambios.",
  errorApplyDraft:
    "Aplica tu registro con Añadir mes o Actualizar mes antes de guardar el JSON.",
  errorAmount:
    "Introduce un importe positivo o cero, con un máximo de dos decimales.",
  errorAmountTooLarge:
    "El importe es demasiado grande. Introduce como máximo 10.000.000.000,00.",
  errorInvalidJson:
    "Este archivo no contiene un JSON válido. Tus datos actuales no se han modificado.",
  errorUnsupportedJson:
    "Este archivo no es compatible con cgb-my-savings. Comprueba la versión, los orígenes y los valores mensuales.",
  errorExternalChange:
    "El archivo JSON ha cambiado fuera de esta aplicación. Guarda tus cambios en un archivo nuevo y vuelve a abrir el original para revisarlo.",
  errorBrowser:
    "Usa un navegador con selector de archivos, como Chrome o Edge de escritorio, o una versión compatible de Chrome para Android.",
  errorNoFile: "No se ha seleccionado ningún archivo JSON.",
  errorEmptyMonth: "Introduce al menos un saldo o un valor previsto.",
  errorSourceName: "Introduce un nombre para tu origen de ahorro.",
  errorDuplicateSource: "Ya existe un origen con ese nombre.",
  errorOperation:
    "La operación ha fallado. Tus cambios siguen en esta pestaña; inténtalo de nuevo.",
  errorOperationDetails:
    "La operación ha fallado. Tus cambios siguen en esta pestaña. Detalles: {details}",
  errorPermission:
    "Se ha denegado el acceso al archivo. Vuelve a abrir el JSON, concede permiso e inténtalo de nuevo.",
  errorFileMissing:
    "No se ha encontrado el archivo. Guarda tus cambios en un archivo JSON nuevo.",
  errorDiskSpace:
    "No hay suficiente espacio para guardar este archivo. Libera espacio e inténtalo de nuevo.",
  errorLanguageRead:
    "No se ha podido leer tu preferencia de idioma. Se usará el idioma del navegador durante esta sesión.",
  errorLanguageSave:
    "El idioma se ha cambiado para esta sesión, pero no se ha podido guardar la preferencia en este dispositivo.",
  errorPwaContext:
    "La instalación sin conexión requiere HTTPS (o localhost para pruebas) y un navegador compatible con service workers.",
  errorPwaCache:
    "No se han podido guardar todos los archivos de la aplicación para usarlos sin conexión. Conéctate y vuelve a abrirla antes de depender del acceso sin conexión.",
};

export type MessageKey = keyof typeof en;
export type ErrorKey = Extract<MessageKey, `error${string}`>;
export type MessageValues = Readonly<Record<string, string | number>>;

export function translate(
  language: Language,
  key: MessageKey,
  values: MessageValues = {},
): string {
  const message = (language === "es" ? es : en)[key];
  return message.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (values[name] === undefined)
      throw new Error(`Missing translation parameter: ${key}.${name}`);
    return String(values[name]);
  });
}

export function translator(language: Language) {
  return (key: MessageKey, values?: MessageValues) =>
    translate(language, key, values);
}

export class AppError extends Error {
  constructor(public readonly key: ErrorKey) {
    super(translate("en", key));
    this.name = "AppError";
  }
}

export function detectLanguage(languages: readonly string[]): Language {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "en" || base === "es") return base;
  }
  return "en";
}

export function loadLanguage(): {
  language: Language;
  warning: ErrorKey | null;
} {
  const fallback = detectLanguage(navigator.languages);
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "es")
      return { language: saved, warning: null };
    return {
      language: fallback,
      warning: saved === null ? null : "errorLanguageRead",
    };
  } catch {
    return { language: fallback, warning: "errorLanguageRead" };
  }
}
