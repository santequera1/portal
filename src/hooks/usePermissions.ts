import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const canWrite = isAdmin;
  const canEditSelf = true; // All users can edit their own data

  return { isAdmin, canWrite, canEditSelf, role };
}
