import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

interface StudentDistributionProps {
  data?: DistributionItem[];
}

const defaultColors = [
  "hsl(230, 60%, 26%)",
  "hsl(229, 51%, 37%)",
  "hsl(25, 84%, 51%)",
  "hsl(200, 60%, 40%)",
  "hsl(150, 50%, 40%)",
];

export function StudentDistribution({ data: propData }: StudentDistributionProps) {
  const data = (propData || []).map((item, i) => ({
    ...item,
    color: item.color || defaultColors[i % defaultColors.length],
  }));
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Distribución de Estudiantes
      </h3>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} estudiantes (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 20%, 88%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs sm:text-sm text-muted-foreground">{item.name}</span>
            <span className="text-xs sm:text-sm font-medium font-mono">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border text-center">
        <p className="text-3xl font-bold font-heading text-foreground">{total}</p>
        <p className="text-sm text-muted-foreground">Total Estudiantes</p>
      </div>
    </div>
  );
}
