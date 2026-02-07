import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceChartProps {
  data?: Array<{ day: string; presentes: number; ausentes: number }>;
  isLoading?: boolean;
}

export function AttendanceChart({ data, isLoading }: AttendanceChartProps) {
  const chartData = data && data.length > 0 ? data : [
    { day: "Lun", presentes: 0, ausentes: 0 },
    { day: "Mar", presentes: 0, ausentes: 0 },
    { day: "Mie", presentes: 0, ausentes: 0 },
    { day: "Jue", presentes: 0, ausentes: 0 },
    { day: "Vie", presentes: 0, ausentes: 0 },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Asistencia Semanal
          </h3>
          <p className="text-sm text-muted-foreground">
            Estudiantes presentes esta semana
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Presentes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Ausentes</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[250px] flex items-center justify-center">
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPresentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230, 60%, 26%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(230, 60%, 26%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAusentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(356, 75%, 44%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(356, 75%, 44%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 20%, 88%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 20%, 88%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 20%, 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="presentes"
                stroke="hsl(230, 60%, 26%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPresentes)"
              />
              <Area
                type="monotone"
                dataKey="ausentes"
                stroke="hsl(356, 75%, 44%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAusentes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
