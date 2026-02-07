import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { StudentDistribution } from "@/components/dashboard/StudentDistribution";
import { PendingFees } from "@/components/dashboard/PendingFees";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  GraduationCap,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
} from "lucide-react";

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
};

export default function Index() {
  const { data: stats, isLoading } = useDashboardStats();
  const { selectedOrg } = useOrganization();

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido al sistema de gestion - {selectedOrg?.name || 'Todas las entidades'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border">
            <Calendar className="w-4 h-4" />
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>Sesion Academica: {stats?.academicSession || "-"}</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Estudiantes"
                value={stats?.totalStudents?.toLocaleString() || "0"}
                subtitle={`${stats?.totalStudents || 0} matriculados`}
                icon={GraduationCap}
              />
              <StatCard
                title="Personal Activo"
                value={String(stats?.activeStaff || 0)}
                subtitle={`${stats?.teacherCount || 0} docentes`}
                icon={Users}
              />
              <StatCard
                title="Ingresos del Mes"
                value={formatCurrency(stats?.monthlyIncome || 0)}
                subtitle={
                  stats?.incomeGrowth
                    ? `${stats.incomeGrowth > 0 ? "+" : ""}${stats.incomeGrowth.toFixed(1)}% vs mes anterior`
                    : undefined
                }
                icon={CreditCard}
                trend={
                  stats?.incomeGrowth !== undefined
                    ? { value: Math.abs(stats.incomeGrowth), isPositive: stats.incomeGrowth >= 0 }
                    : undefined
                }
                variant="gradient"
              />
              <StatCard
                title="Asistencia Hoy"
                value={`${stats?.attendanceToday?.percentage?.toFixed(1) || 0}%`}
                subtitle={`${stats?.attendanceToday?.present || 0} de ${stats?.attendanceToday?.total || 0} estudiantes`}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <AttendanceChart
              data={stats?.attendanceWeekly}
              isLoading={isLoading}
            />
            <FinanceChart
              data={stats?.financeMonthly}
              monthlyIncome={stats?.monthlyIncome}
              monthlyExpense={stats?.monthlyExpense}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <QuickActions />
            <StudentDistribution data={stats?.studentDistribution} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PendingFees data={stats?.pendingFees} />
          </div>
          <div className="lg:col-span-1">
            <UpcomingEvents data={stats?.upcomingEvents} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity data={stats?.recentActivity} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
