import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { User, UserCircle, Phone, MapPin, Briefcase, Shield, Lock, Save, Loader2 } from "lucide-react";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador",
  TEACHER: "Profesor",
  ACCOUNTANT: "Contador",
  STUDENT: "Estudiante",
  PARENT: "Padre/Madre",
};

export default function Perfil() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cargo, setCargo] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCargo(user.cargo || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    try {
      await api.put("/auth/profile", {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        cargo: cargo.trim() || null,
      });
      toast({
        title: "Perfil actualizado",
        description: "Los datos del perfil se guardaron correctamente.",
      });
      // Reload the page so AuthContext refetches the user from /auth/me
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error al actualizar perfil",
        description: err.message || "Ocurrio un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Todos los campos de contrasena son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contrasena debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contrasenas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      toast({
        title: "Contrasena actualizada",
        description: "La contrasena se cambio correctamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error al cambiar contrasena",
        description: err.message || "Ocurrio un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administra tu informacion personal y credenciales de acceso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Summary Card */}
          <Card className="rounded-xl lg:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <UserCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-xl mt-3">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" />
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{user.address}</span>
                  </div>
                )}
                {user.cargo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{user.cargo}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Edit Card */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Informacion Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email (read-only) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Correo electronico
                      </label>
                      <Input
                        value={user.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        El correo no se puede modificar.
                      </p>
                    </div>

                    {/* Role (read-only) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <Input
                        value={ROLE_LABELS[user.role] || user.role}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        El rol es asignado por un administrador.
                      </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nombre completo *
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ingresa tu nombre completo"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Telefono</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 300 123 4567"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Direccion</label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej: Calle 10 #5-30"
                      />
                    </div>

                    {/* Cargo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cargo</label>
                      <Input
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        placeholder="Ej: Coordinador Academico"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5" />
                  Cambiar Contrasena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Contrasena actual *
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Tu contrasena actual"
                        autoComplete="current-password"
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nueva contrasena *
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimo 6 caracteres"
                        autoComplete="new-password"
                      />
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Confirmar contrasena *
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contrasena"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="outline" disabled={savingPassword}>
                      {savingPassword ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Cambiar Contrasena
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
