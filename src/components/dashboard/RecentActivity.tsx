import {
  UserPlus,
  CreditCard,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  data?: ActivityItem[];
}

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  admission: { icon: UserPlus, color: "text-secondary bg-secondary/10" },
  payment: { icon: CreditCard, color: "text-success bg-success/10" },
  attendance: { icon: ClipboardCheck, color: "text-primary bg-primary/10" },
  alert: { icon: AlertCircle, color: "text-destructive bg-destructive/10" },
  success: { icon: CheckCircle2, color: "text-success bg-success/10" },
};

const defaultIcon = { icon: Activity, color: "text-muted-foreground bg-muted" };

export function RecentActivity({ data = [] }: RecentActivityProps) {
  const activities = data;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Actividad Reciente
        </h3>
        <button className="text-sm text-primary hover:underline">
          Ver todo
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sin actividad reciente
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon: Icon, color } = iconMap[activity.type] || defaultIcon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
