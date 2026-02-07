import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingStudent {
  id: number;
  name: string;
  class: string;
  amount: number;
  daysOverdue: number;
}

interface PendingFeesProps {
  data?: PendingStudent[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function PendingFees({ data = [] }: PendingFeesProps) {
  const pendingStudents = data;
  const totalPending = pendingStudents.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Cuotas Pendientes
            </h3>
            <p className="text-sm text-muted-foreground">
              {pendingStudents.length} estudiantes con pagos atrasados
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base sm:text-2xl font-bold font-mono text-destructive">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-xs text-muted-foreground">Total pendiente</p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {student.name}
              </p>
              <p className="text-xs text-muted-foreground">{student.class}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-foreground">
                  {formatCurrency(student.amount)}
                </p>
                <Badge
                  variant="secondary"
                  className={
                    student.daysOverdue > 14
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }
                >
                  {student.daysOverdue} días
                </Badge>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full mt-4 text-primary hover:text-primary"
      >
        Ver todos los pendientes
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
