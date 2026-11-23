import {
  actualTotal,
  activeSources,
  money,
  monthlyChange,
  monthLabel,
  previousMonth,
  signedMoney,
  type SavingsData,
} from "../model";
import { translator, type Language } from "../i18n";

export default function HistoryTable({
  data,
  sourceId,
  onEdit,
  disabled,
  language,
}: {
  data: SavingsData;
  sourceId: string | null;
  onEdit(month: string): void;
  disabled: boolean;
  language: Language;
}) {
  const t = translator(language);
  const filtered = sourceId !== null;
  const source = data.sources.find((item) => item.id === sourceId);
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">{t("historyCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("month")}</th>
            <th scope="col">
              {filtered ? t("sourceBalance") : t("totalSavings")}
            </th>
            <th scope="col">{t("monthlyChange")}</th>
            <th scope="col">{t("predictedValue")}</th>
            <th scope="col">{t("versusPrediction")}</th>
            <th scope="col">
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...data.snapshots].reverse().map((snapshot) => {
            const total = actualTotal(data, snapshot);
            let displayed = total;
            let change = monthlyChange(data, snapshot);
            if (filtered) {
              displayed = Object.hasOwn(snapshot.balances, sourceId)
                ? snapshot.balances[sourceId]
                : null;
              const priorMonth = data.snapshots.find(
                (item) => item.month === previousMonth(snapshot.month),
              );
              const prior = priorMonth?.balances[sourceId];
              change =
                displayed !== null && prior !== undefined
                  ? displayed - prior
                  : null;
            }
            const difference =
              !filtered && total !== null && snapshot.predicted !== null
                ? total - snapshot.predicted
                : null;
            const entered = Object.keys(snapshot.balances).length;
            const expected = activeSources(data, snapshot.month).length;
            return (
              <tr key={snapshot.month}>
                <th scope="row">
                  {monthLabel(snapshot.month, true, language)}
                  {!filtered && total === null && (
                    <small className="incomplete">
                      {t("enteredBalances", { entered, expected })}
                    </small>
                  )}
                  {filtered && source && source.startMonth > snapshot.month && (
                    <small className="incomplete">{t("notTracked")}</small>
                  )}
                </th>
                <td className="table-amount">
                  {displayed === null ? (
                    <span className="muted">
                      {entered ? t("incomplete") : t("notEntered")}
                    </span>
                  ) : (
                    money(displayed, language)
                  )}
                </td>
                <td
                  className={
                    change !== null && change < 0 ? "negative" : "positive"
                  }
                >
                  {change === null ? (
                    <span className="muted">—</span>
                  ) : (
                    signedMoney(change, language)
                  )}
                </td>
                <td>
                  {!filtered && snapshot.predicted !== null ? (
                    money(snapshot.predicted, language)
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {difference === null ? (
                    <span className="muted">—</span>
                  ) : (
                    <span
                      className={`pill ${difference < 0 ? "behind" : "ahead"}`}
                    >
                      {signedMoney(difference, language)}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="text-button"
                    disabled={disabled}
                    onClick={() => onEdit(snapshot.month)}
                    aria-label={t("editMonth", {
                      month: monthLabel(snapshot.month, false, language),
                    })}
                  >
                    {t("edit")}
                  </button>
                </td>
              </tr>
            );
          })}
          {!data.snapshots.length && (
            <tr>
              <td colSpan={6} className="table-empty">
                {t("historyEmpty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
