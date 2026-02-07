import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CreditCard,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ClipboardList,
  Award,
  CalendarDays,
  UserCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Estudiantes", icon: GraduationCap, href: "/estudiantes" },
  { title: "Personal", icon: UserCog, href: "/personal", roles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: "Academico", icon: BookOpen, href: "/academico" },
  { title: "Calendario", icon: CalendarDays, href: "/calendario" },
  { title: "Asistencia", icon: UserCheck, href: "/asistencia" },
  { title: "Examenes", icon: ClipboardList, href: "/examenes" },
  { title: "Calificaciones", icon: Award, href: "/calificaciones" },
  { title: "Finanzas", icon: CreditCard, href: "/finanzas", roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { title: "Configuracion", icon: Settings, href: "/configuracion", roles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: "Mi Perfil", icon: UserCircle, href: "/perfil" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role;

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar flex flex-col border-r border-sidebar-border",
          // Desktop: always visible, controlled by collapsed
          "lg:translate-x-0 lg:transition-all lg:duration-300",
          collapsed ? "lg:w-[70px]" : "lg:w-[260px]",
          // Mobile: slide in/out, always full width (260px)
          "w-[260px] transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + close/collapse */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center mx-auto">
              <img src="/logo-login.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="animate-fade-in flex-1 min-w-0">
              <img src="/logo-horizontal.png" alt="Minerva" className="h-10 object-contain" />
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle (next to logo) */}
          {!collapsed && (
            <button
              onClick={onToggle}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors ml-2"
              title="Colapsar menu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                      isActive && "bg-sidebar-accent text-sidebar-foreground border-l-4 border-accent -ml-[2px] pl-[10px]",
                      collapsed && "lg:justify-center lg:px-2"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className={cn("flex-shrink-0", collapsed ? "lg:w-6 lg:h-6 w-5 h-5" : "w-5 h-5")} />
                    <span className={cn(
                      "flex-1 animate-fade-in",
                      collapsed && "lg:hidden"
                    )}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground animate-pulse-soft",
                        collapsed && "lg:hidden"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desktop expand button (only visible when collapsed) */}
        {collapsed && (
          <div className="hidden lg:block p-3 border-t border-sidebar-border flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              title="Expandir menu"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
