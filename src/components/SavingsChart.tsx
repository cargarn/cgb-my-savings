import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  actualTotal,
  money,
  monthLabel,
  SOURCE_COLORS,
  type SavingsData,
} from "../model";
import Icon from "./Icon";
import { LOCALES, translator, type Language } from "../i18n";

export default function SavingsChart({
  data,
  sourceId,
  language,
}: {
  data: SavingsData;
  sourceId: string | null;
  language: Language;
}) {
  const t = translator(language);
  const filtered = sourceId !== null;
  const sources = data.sources.filter(
    (source) => !filtered || source.id === sourceId,
  );
  const rows = data.snapshots.map((snapshot) => {
    const complete = actualTotal(data, snapshot) !== null;
    const row: Record<string, string | number | null> = {
      month: monthLabel(snapshot.month, true, language),
      predicted:
        filtered || snapshot.predicted === null
          ? null
          : snapshot.predicted / 100,
    };
    for (const source of sources) {
      const available = filtered || complete;
      row[`balance-${source.id}`] =
        available && Object.hasOwn(snapshot.balances, source.id)
          ? snapshot.balances[source.id] / 100
          : null;
    }
    return row;
  });

  return (
    <div className="chart-container">
      {!rows.length ? (
        <div className="chart-empty">
          <div className="empty-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="empty-icon">
            <Icon name="chart" size={25} />
          </div>
          <h3>{t("chartEmptyTitle")}</h3>
          <p>{t("chartEmptyDescription")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={310} minWidth={0}>
          <ComposedChart
            data={rows}
            margin={{ top: 16, right: 12, bottom: 0, left: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="#eef0f5" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6b6d84" }}
              dy={10}
              minTickGap={24}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={66}
              tick={{ fontSize: 11, fill: "#6b6d84" }}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat(LOCALES[language], {
                  style: "currency",
                  currency: "EUR",
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? money(Math.round(value * 100), language)
                  : t("notEntered")
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e8e9f1",
                fontSize: 13,
              }}
              cursor={{ fill: "#f5f4ff" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 24 }}
            />
            {sources.map((source) => (
              <Bar
                key={source.id}
                dataKey={`balance-${source.id}`}
                name={source.name}
                stackId="savings"
                fill={
                  SOURCE_COLORS[
                    data.sources.indexOf(source) % SOURCE_COLORS.length
                  ]
                }
                maxBarSize={42}
                isAnimationActive={false}
              />
            ))}
            {!filtered && (
              <Line
                type="linear"
                dataKey="predicted"
                name={t("predictedValue")}
                stroke="#363c56"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
