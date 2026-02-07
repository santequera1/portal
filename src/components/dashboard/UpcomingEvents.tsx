import { Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

interface UpcomingEventsProps {
  data?: EventItem[];
}

const typeColors: Record<string, string> = {
  exam: "bg-destructive/10 text-destructive",
  meeting: "bg-secondary/10 text-secondary",
  event: "bg-success/10 text-success",
  deadline: "bg-warning/10 text-warning",
};

const typeLabels: Record<string, string> = {
  exam: "Examen",
  meeting: "Reunion",
  event: "Evento",
  deadline: "Fecha Limite",
};

export function UpcomingEvents({ data = [] }: UpcomingEventsProps) {
  const events = data;
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Proximos Eventos
        </h3>
        <button className="text-sm text-primary hover:underline">
          Ver calendario
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all"
          >
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">
                {event.date.split(" ")[0]}
              </span>
              <span className="text-xs text-primary/80">
                {event.date.split(" ")[1]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {event.title}
                </p>
                <Badge className={typeColors[event.type] || typeColors.event} variant="secondary">
                  {typeLabels[event.type] || event.type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </span>
                {event.location !== "-" && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
