import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface FinanceChartProps {
  data?: Array<{ month: string; ingresos: number; egresos: number }>;
  monthlyIncome?: number;
  monthlyExpense?: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatShortCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return formatCurrency(value);
};

export function FinanceChart({ data, monthlyIncome = 0, monthlyExpense = 0, isLoading }: FinanceChartProps) {
  const chartData = data && data.length > 0 ? data : [];
  const balance = monthlyIncome - monthlyExpense;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Ingresos vs Egresos
          </h3>
          <p className="text-sm text-muted-foreground">
            Ultimos 6 meses
          </p>
        </div>
        <div className="text-right">
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <p className="text-2xl font-bold font-mono text-success">
                {formatShortCurrency(balance)}
              </p>
              <p className="text-xs text-muted-foreground">Balance del mes</p>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[250px] flex items-center justify-center">
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 20%, 88%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 20%, 88%)" }}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 20%, 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-muted-foreground capitalize">{value}</span>
                )}
              />
              <Bar
                dataKey="ingresos"
                fill="hsl(230, 60%, 26%)"
                radius={[4, 4, 0, 0]}
                name="Ingresos"
              />
              <Bar
                dataKey="egresos"
                fill="hsl(25, 84%, 51%)"
                radius={[4, 4, 0, 0]}
                name="Egresos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
