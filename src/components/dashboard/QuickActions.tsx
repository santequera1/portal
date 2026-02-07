import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ClipboardCheck,
  CreditCard,
  FileText,
  Calendar,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Nueva Admision", icon: UserPlus, color: "bg-primary hover:bg-primary/90", path: "/estudiantes" },
  { label: "Registrar Pago", icon: CreditCard, color: "bg-success hover:bg-success/90", path: "/finanzas" },
  { label: "Tomar Asistencia", icon: ClipboardCheck, color: "bg-secondary hover:bg-secondary/90", path: "/asistencia" },
  { label: "Crear Reporte", icon: FileText, color: "bg-accent hover:bg-accent/90", path: "/finanzas" },
  { label: "Agendar Evento", icon: Calendar, color: "bg-warning hover:bg-warning/90", path: "/academico" },
  { label: "Enviar Aviso", icon: Bell, color: "bg-destructive hover:bg-destructive/90", path: "/configuracion" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Acciones Rapidas
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              className={`${action.color} text-white h-auto py-4 flex flex-col items-center gap-2 transition-transform hover:scale-105`}
              onClick={() => navigate(action.path)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
