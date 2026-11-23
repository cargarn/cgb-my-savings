import { useEffect, useRef, useState, type FormEvent } from "react";
import { isMonth, type Source } from "../model";
import Icon from "./Icon";
import { translator, type ErrorKey, type Language } from "../i18n";

export default function SourceDialog({
  month,
  sources,
  onAdd,
  onClose,
  language,
}: {
  month: string;
  sources: Source[];
  onAdd(source: Source): void;
  onClose(): void;
  language: Language;
}) {
  const t = translator(language);
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(month);
  const [error, setError] = useState<ErrorKey | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("errorSourceName");
    if (
      sources.some(
        (source) => source.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return setError("errorDuplicateSource");
    }
    if (!isMonth(startMonth)) return setError("errorFirstMonth");
    onAdd({ id: crypto.randomUUID(), name: trimmed, startMonth });
  }

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="source-title">
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">{t("sourceEyebrow")}</span>
          <h2 id="source-title">{t("sourceDialogTitle")}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={t("closeSource")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="source-name">{t("sourceName")}</label>
        <input
          id="source-name"
          autoFocus
          maxLength={60}
          placeholder={t("sourcePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor="source-start">{t("firstMonth")}</label>
        <input
          id="source-start"
          type="month"
          min="1900-01"
          max="9999-12"
          required
          value={startMonth}
          onChange={(event) => setStartMonth(event.target.value)}
        />
        <p className="field-note">{t("firstMonthHelp")}</p>
        {error && (
          <p role="alert" className="inline-error">
            {t(error)}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="button primary">
            {t("addSource")}
            <Icon name="plus" size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
