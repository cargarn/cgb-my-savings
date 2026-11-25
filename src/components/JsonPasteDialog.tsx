import { useEffect, useRef, useState, type FormEvent } from "react";
import { parseSavings, type SavingsData } from "../model";
import { errorMessage } from "../storage";
import { translator, type Language } from "../i18n";
import Icon from "./Icon";

export default function JsonPasteDialog({
  onImport,
  onClose,
  language,
}: {
  onImport(data: SavingsData): boolean;
  onClose(): void;
  language: Language;
}) {
  const t = translator(language);
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (onImport(parseSavings(text))) onClose();
    } catch (caught) {
      setError(errorMessage(caught, language));
    }
  }

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="paste-json-title">
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">{t("pasteJson")}</span>
          <h2 id="paste-json-title">{t("pasteJsonTitle")}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={t("closePasteJson")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <form onSubmit={submit}>
        <p className="paste-json-description">{t("pasteJsonDescription")}</p>
        <label htmlFor="json-content">{t("jsonContent")}</label>
        <textarea
          id="json-content"
          autoFocus
          spellCheck={false}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
        />
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="button primary">
            {t("importJson")}
            <Icon name="check" size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
