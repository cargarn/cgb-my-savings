import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  actualTotal,
  currentMonth,
  emptyData,
  isMonth,
  money,
  monthlyChange,
  monthLabel,
  previousMonth,
  signedMoney,
  SOURCE_COLORS,
  upsertSnapshot,
  type SavingsData,
  type Snapshot,
  type Source,
} from "./model";
import {
  browserFiles,
  errorMessage,
  isCancelled,
  type FileRepository,
  type SavingsFile,
} from "./storage";
import HistoryTable from "./components/HistoryTable";
import Icon from "./components/Icon";
import MonthEditor from "./components/MonthEditor";
import SourceDialog from "./components/SourceDialog";
import PwaControls from "./components/PwaControls";
import {
  AppError,
  LANGUAGE_STORAGE_KEY,
  LOCALES,
  loadLanguage,
  translator,
  type ErrorKey,
  type Language,
  type MessageKey,
  type MessageValues,
} from "./i18n";

const SavingsChart = lazy(() => import("./components/SavingsChart"));

interface Props {
  repository?: FileRepository;
  confirmAction?: (message: string) => boolean;
}

interface Notice {
  key: MessageKey;
  values?: MessageValues;
  month?: string;
  remindToSave?: boolean;
}

export default function App({
  repository,
  confirmAction = (message) => window.confirm(message),
}: Props) {
  const [preference, setPreference] = useState(loadLanguage);
  const { language } = preference;
  const t = translator(language);
  const [files] = useState(() => repository ?? browserFiles());
  const [data, setData] = useState<SavingsData>(emptyData);
  const [file, setFile] = useState<SavingsFile | null>(null);
  const [dirty, setDirty] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editorVersion, setEditorVersion] = useState(0);
  const [addingSource, setAddingSource] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const complete = data.snapshots.filter(
    (snapshot) => actualTotal(data, snapshot) !== null,
  );
  const latest = complete.at(-1);
  const total = latest ? actualTotal(data, latest) : null;
  const change = latest ? monthlyChange(data, latest) : null;
  const priorSnapshot = latest
    ? data.snapshots.find(
        (snapshot) => snapshot.month === previousMonth(latest.month),
      )
    : undefined;
  const priorTotal = priorSnapshot ? actualTotal(data, priorSnapshot) : null;
  const priorChange = priorSnapshot ? monthlyChange(data, priorSnapshot) : null;
  const improvement =
    change !== null && priorChange !== null ? change - priorChange : null;
  const difference =
    latest && total !== null && latest.predicted !== null
      ? total - latest.predicted
      : null;
  let changeDescription = t("needConsecutive");
  if (change !== null && priorTotal !== null) {
    changeDescription = t("zeroBaseline");
    if (priorTotal !== 0) {
      changeDescription = t("percentageChange", {
        percentage: new Intl.NumberFormat(LOCALES[language], {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(change / priorTotal),
      });
    }
  }

  useEffect(() => {
    const text = translator(language);
    document.documentElement.lang = language;
    document.title = text("documentTitle");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", text("documentDescription"));
  }, [language]);

  useEffect(() => {
    if (!dirty && !draftDirty) return;
    const protectChanges = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", protectChanges);
    return () => window.removeEventListener("beforeunload", protectChanges);
  }, [dirty, draftDirty]);

  function chooseLanguage(next: Language) {
    let warning: ErrorKey | null = null;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      warning = "errorLanguageSave";
    }
    setPreference({ language: next, warning });
  }

  function changed(next: SavingsData, message: Notice) {
    setData(next);
    setDirty(true);
    setError(null);
    setNotice({ ...message, remindToSave: true });
  }

  async function fileAction(action: "open" | "create" | "save") {
    if (busy) return;
    if (action !== "open" && draftDirty) {
      setError(new AppError("errorApplyDraft"));
      return;
    }
    if (
      action === "open" &&
      (dirty || draftDirty) &&
      !confirmAction(t("confirmOpen"))
    )
      return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (action === "open") {
        const opened = await files.open();
        setData(opened.data);
        setFile(opened.file);
        setSourceId(null);
        setSelectedMonth(opened.data.snapshots.at(-1)?.month ?? currentMonth());
        setEditorVersion((value) => value + 1);
        setDraftDirty(false);
        setNotice({ key: "fileOpened", values: { name: opened.file.name } });
      } else if (action === "create" || !file) {
        const created = await files.create(data);
        setFile(created);
        setNotice({ key: "fileSaved", values: { name: created.name } });
      } else {
        await file.save(data);
        setNotice({ key: "fileSaved", values: { name: file.name } });
      }
      setDirty(false);
    } catch (error) {
      if (!isCancelled(error)) setError(error);
    } finally {
      setBusy(false);
    }
  }

  function addSource(source: Source) {
    changed(
      { ...data, sources: [...data.sources, source] },
      { key: "sourceAdded", values: { name: source.name } },
    );
    setAddingSource(false);
  }

  function applyMonth(snapshot: Snapshot) {
    changed(upsertSnapshot(data, snapshot), {
      key: "monthUpdated",
      month: snapshot.month,
    });
    setDraftDirty(false);
  }

  function editMonth(month: string) {
    if (draftDirty && !confirmAction(t("confirmMonth"))) return;
    setDraftDirty(false);
    setSelectedMonth(month);
    setEditorVersion((value) => value + 1);
    editor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteMonth() {
    if (
      !confirmAction(
        t("confirmDelete", {
          month: monthLabel(selectedMonth, false, language),
        }),
      )
    )
      return;
    changed(
      {
        ...data,
        snapshots: data.snapshots.filter(
          (snapshot) => snapshot.month !== selectedMonth,
        ),
      },
      { key: "monthDeleted" },
    );
    setDraftDirty(false);
    setEditorVersion((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="./"
          onClick={(event) => event.preventDefault()}
          aria-label={t("home")}
        >
          <span className="brand-mark">
            <Icon name="wallet" size={24} />
          </span>
          <span>
            cgb-my-savings
            <small>{t("brandTagline")}</small>
          </span>
        </a>
        <div className="header-preferences">
          <span className="privacy-badge">
            <Icon name="shield" size={15} /> {t("privacyBadge")}
          </span>
          <label htmlFor="language-select" className="sr-only">
            {t("language")}
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "en" || value === "es") chooseLanguage(value);
            }}
          >
            <option value="en" lang="en">
              English
            </option>
            <option value="es" lang="es">
              Español
            </option>
          </select>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <span className="eyebrow">{t("pageEyebrow")}</span>
            <h1>
              {t("pageTitle")}
              <span>.</span>
            </h1>
            <p>{t("pageSubtitle")}</p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy || !files.supported}
              onClick={() => void fileAction("open")}
            >
              <Icon name="folder" size={17} /> {t("openJson")}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy || !files.supported}
              onClick={() => void fileAction("save")}
            >
              <Icon name="save" size={17} />
              {busy ? t("working") : t("saveJson")}
              {dirty && <span className="unsaved-dot" aria-hidden="true" />}
            </button>
          </div>
        </section>

        <div className="file-strip">
          <span
            className={`status-dot ${dirty || draftDirty ? "dirty" : ""}`}
          />
          <span>
            {file ? file.name : t("noFile")}
            <span className="file-state">
              {" "}
              · {dirty || draftDirty ? t("unsaved") : t("allSaved")}
              {!file && !dirty && !draftDirty ? ` · ${t("startHint")}` : ""}
            </span>
          </span>
          {file && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void fileAction("create")}
            >
              {t("saveAs")}
            </button>
          )}
          <span className="local-label">
            <Icon name="shield" size={13} /> {t("localOnly")}
          </span>
        </div>
        {!files.supported && (
          <div className="alert" role="alert">
            <strong>{t("unsupportedTitle")}</strong>{" "}
            {t("unsupportedDescription")}
          </div>
        )}
        {preference.warning && (
          <div className="alert" role="alert">
            {t(preference.warning)}
          </div>
        )}
        {error != null && (
          <div className="alert error" role="alert">
            {errorMessage(error, language)}
          </div>
        )}
        <div className="notice" role="status" aria-live="polite">
          {notice
            ? t(notice.key, {
                ...notice.values,
                month: notice.month
                  ? monthLabel(notice.month, false, language)
                  : "",
              })
            : t("privacyNotice")}
          {notice?.remindToSave ? ` ${t("saveReminder")}` : ""}
        </div>

        <PwaControls language={language} />

        <section className="stats-grid" aria-label={t("overview")}>
          <article className="stat-card featured">
            <div className="stat-heading">
              <span>{t("totalSavings")}</span>
              <span className="icon-tile">
                <Icon name="wallet" />
              </span>
            </div>
            <strong>{total === null ? "—" : money(total, language)}</strong>
            <p>
              {latest
                ? t("asOf", {
                    month: monthLabel(latest.month, false, language),
                  })
                : t("latestBalance")}
            </p>
            <div className="stat-bottom">
              <span className="soft-pill">
                {t(
                  data.sources.length === 1
                    ? "sourceCountOne"
                    : "sourceCountOther",
                  { count: data.sources.length },
                )}
              </span>
              <span className="mini-bars" aria-hidden="true">
                ▂ ▄ ▃ ▆ ▅ █
              </span>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-heading">
              <span>{t("monthlyChange")}</span>
              <span className="icon-tile mint">
                <Icon name="trend" />
              </span>
            </div>
            <strong
              className={
                change !== null && change < 0 ? "negative" : "positive"
              }
            >
              {change === null ? "—" : signedMoney(change, language)}
            </strong>
            <p>{changeDescription}</p>
            <div className="stat-bottom muted">
              {improvement === null
                ? t("balanceNotContributions")
                : t("changeComparison", {
                    amount: signedMoney(improvement, language),
                  })}
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-heading">
              <span>{t("predictedValue")}</span>
              <span className="icon-tile peach">
                <Icon name="target" />
              </span>
            </div>
            <strong>
              {latest?.predicted != null
                ? money(latest.predicted, language)
                : "—"}
            </strong>
            <p>
              {latest
                ? t("expectationFor", {
                    month: monthLabel(latest.month, true, language),
                  })
                : t("expectedTotal")}
            </p>
            <div className="stat-bottom">
              {difference === null ? (
                <span className="muted">{t("setPrediction")}</span>
              ) : (
                <span className={`pill ${difference < 0 ? "behind" : "ahead"}`}>
                  {t(difference < 0 ? "behindPlan" : "aheadOfPlan", {
                    amount: signedMoney(difference, language),
                  })}
                </span>
              )}
            </div>
          </article>
        </section>

        <div className="workspace">
          <div className="main-column">
            <section
              className="panel chart-panel"
              aria-labelledby="chart-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="chart-heading">{t("savingsJourney")}</h2>
                  <p>{t("journeySubtitle")}</p>
                </div>
                <div className="source-controls">
                  <label htmlFor="source-filter" className="sr-only">
                    {t("filterSource")}
                  </label>
                  <select
                    id="source-filter"
                    value={sourceId ?? ""}
                    disabled={busy}
                    onChange={(event) =>
                      setSourceId(event.target.value || null)
                    }
                  >
                    <option value="">{t("allSources")}</option>
                    {data.sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-button add-source-button"
                    disabled={busy}
                    aria-label={t("addSavingsSource")}
                    onClick={() => setAddingSource(true)}
                  >
                    <Icon name="plus" size={18} />
                  </button>
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="chart-loading" role="status">
                    {t("loadingChart")}
                  </div>
                }
              >
                <SavingsChart
                  data={data}
                  sourceId={sourceId}
                  language={language}
                />
              </Suspense>
              <div className="chart-note">
                <span className="note-dot" />
                {sourceId === null ? t("chartNote") : t("filteredChartNote")}
              </div>
            </section>
            <section
              className="panel history-panel"
              aria-labelledby="history-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="history-heading">{t("history")}</h2>
                  <p>{t("historySubtitle")}</p>
                </div>
                <span className="count-badge">
                  {t(
                    data.snapshots.length === 1
                      ? "monthCountOne"
                      : "monthCountOther",
                    { count: data.snapshots.length },
                  )}
                </span>
              </div>
              <HistoryTable
                data={data}
                sourceId={sourceId}
                onEdit={editMonth}
                disabled={busy}
                language={language}
              />
            </section>
          </div>
          <div ref={editor} className="editor-column">
            <MonthEditor
              key={`${selectedMonth}:${editorVersion}`}
              data={data}
              month={selectedMonth}
              disabled={busy}
              onMonthChange={(month) => {
                if (isMonth(month)) editMonth(month);
              }}
              onApply={applyMonth}
              onDelete={deleteMonth}
              onAddSource={() => setAddingSource(true)}
              onDraftChange={() => setDraftDirty(true)}
              language={language}
            />
            <div className="gentle-tip">
              <span>✦</span>
              <div>
                <h3>{t("consistencyTitle")}</h3>
                <p>{t("consistencyDescription")}</p>
              </div>
            </div>
          </div>
        </div>

        {data.sources.length > 0 && (
          <section className="sources-strip" aria-label={t("yourSources")}>
            <span className="eyebrow">{t("sourcesEyebrow")}</span>
            {data.sources.map((source, index) => (
              <span className="source-tag" key={source.id}>
                <span
                  style={{
                    background: SOURCE_COLORS[index % SOURCE_COLORS.length],
                  }}
                />
                {source.name}
              </span>
            ))}
          </section>
        )}
        <footer>
          <span>
            cgb-my-savings <span className="footer-divider">/</span>{" "}
            {t("footerTagline")}
          </span>
          <span>
            <Icon name="shield" size={14} /> {t("footerStorage")}
          </span>
        </footer>
      </main>
      {addingSource && (
        <SourceDialog
          sources={data.sources}
          onAdd={addSource}
          onClose={() => setAddingSource(false)}
          language={language}
        />
      )}
    </div>
  );
}
