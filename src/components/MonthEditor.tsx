import { useState, type FormEvent } from "react";
import {
  activeSources,
  money,
  monthLabel,
  parseAmount,
  type SavingsData,
  type Snapshot,
} from "../model";
import Icon from "./Icon";
import { AppError, LOCALES, translator, type Language } from "../i18n";
import { errorMessage } from "../storage";

interface Props {
  data: SavingsData;
  month: string;
  disabled: boolean;
  onMonthChange(month: string): void;
  onApply(snapshot: Snapshot): void;
  onDelete(): void;
  onAddSource(): void;
  onDraftChange(): void;
  language: Language;
}

export default function MonthEditor({
  data,
  month,
  disabled,
  onMonthChange,
  onApply,
  onDelete,
  onAddSource,
  onDraftChange,
  language,
}: Props) {
  const t = translator(language);
  const inputFormatter = new Intl.NumberFormat(LOCALES[language], {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const existing = data.snapshots.find((item) => item.month === month);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(existing?.balances ?? {}).map(([id, value]) => [
        id,
        inputFormatter.format(value / 100),
      ]),
    ),
  );
  const [prediction, setPrediction] = useState(
    existing?.predicted != null
      ? inputFormatter.format(existing.predicted / 100)
      : "",
  );
  const [error, setError] = useState<unknown>(null);
  const sources = activeSources(data, month);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const balances: Record<string, number> = {};
      for (const source of sources) {
        const value = parseAmount(values[source.id] ?? "");
        if (value !== null) balances[source.id] = value;
      }
      const predicted = parseAmount(prediction);
      if (!Object.keys(balances).length && predicted === null) {
        throw new AppError("errorEmptyMonth");
      }
      setError(null);
      onApply({ month, balances, predicted });
    } catch (error) {
      setError(error);
    }
  }

  return (
    <section className="panel editor" aria-labelledby="editor-heading">
      <div className="section-title">
        <div className="icon-tile lavender">
          <Icon name="calendar" />
        </div>
        <div>
          <h2 id="editor-heading">{t("monthlyCheckIn")}</h2>
          <p>{t("checkInSubtitle")}</p>
        </div>
      </div>
      <form onSubmit={apply}>
        <fieldset disabled={disabled}>
          <label htmlFor="snapshot-month">{t("month")}</label>
          <input
            id="snapshot-month"
            type="month"
            min="1900-01"
            max="9999-12"
            required
            value={month}
            onChange={(event) => {
              if (event.target.value) onMonthChange(event.target.value);
            }}
          />
          <div className="field-heading">
            <h3>{t("yourBalances")}</h3>
            <button type="button" className="text-button" onClick={onAddSource}>
              <Icon name="plus" size={14} /> {t("addSource")}
            </button>
          </div>
          {!sources.length && <p className="field-note">{t("noSources")}</p>}
          {sources.map((source) => (
            <label className="amount-field" key={source.id}>
              {source.name}
              <span className="input-affix">
                <span>€</span>
                <input
                  aria-label={t("balanceLabel", { name: source.name })}
                  inputMode="decimal"
                  placeholder={t("notEntered")}
                  value={values[source.id] ?? ""}
                  onChange={(event) => {
                    setValues({ ...values, [source.id]: event.target.value });
                    onDraftChange();
                  }}
                />
              </span>
            </label>
          ))}
          <p className="field-note">{t("balanceHelp")}</p>
          <div className="prediction-field">
            <label htmlFor="predicted-value">
              <Icon name="target" size={17} /> {t("predictedValue")}
            </label>
            <span className="input-affix">
              <span>€</span>
              <input
                id="predicted-value"
                inputMode="decimal"
                placeholder={t("expectedSavings")}
                value={prediction}
                onChange={(event) => {
                  setPrediction(event.target.value);
                  onDraftChange();
                }}
              />
            </span>
            <p className="field-note">{t("predictionHelp")}</p>
          </div>
          {error != null && (
            <p className="inline-error" role="alert">
              {errorMessage(error, language)}
            </p>
          )}
          <button type="submit" className="button primary wide">
            {existing ? t("updateMonth") : t("addMonth")}
            <Icon name="arrow" size={17} />
          </button>
          {existing && (
            <button
              type="button"
              className="text-button danger delete-month"
              onClick={onDelete}
            >
              {t("deleteMonth", { month: monthLabel(month, false, language) })}
            </button>
          )}
        </fieldset>
      </form>
      <div className="editor-footnote">
        <Icon name="save" size={15} />
        <span>{t("editorFootnote")}</span>
      </div>
      {existing?.predicted != null && (
        <span className="sr-only">
          {t("savedPrediction", {
            amount: money(existing.predicted, language),
          })}
        </span>
      )}
    </section>
  );
}
