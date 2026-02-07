import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Organization } from '@/types';

interface OrganizationContextType {
  organizations: Organization[];
  selectedOrgId: number | null;
  selectedOrg: Organization | null;
  setSelectedOrgId: (id: number | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(() => {
    const saved = localStorage.getItem('minerva_org');
    return saved ? parseInt(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api.get<Organization[]>('/organizations')
      .then((orgs) => {
        setOrganizations(orgs);
        if (!selectedOrgId && orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedOrgId) {
      localStorage.setItem('minerva_org', String(selectedOrgId));
    } else {
      localStorage.removeItem('minerva_org');
    }
  }, [selectedOrgId]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || null;

  return (
    <OrganizationContext.Provider value={{ organizations, selectedOrgId, selectedOrg, setSelectedOrgId, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
