import { useCallback, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type AdminModuleSubmodule = {
  id: string;
  code: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  accessLevel: number;
  sortOrder: number;
  active: boolean;
};

export type AdminModuleItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  roleCode: string;
  roleName: string;
  hasSubModules: boolean;
  accessLevel: number;
  sortOrder: number;
  active: boolean;
  submodules: AdminModuleSubmodule[];
};

export type AdminModuleTab = {
  key: string;
  label: string;
  modules: AdminModuleItem[];
};

export type CreateModuleInput = {
  roleId: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  hasSubModules: boolean;
  accessLevel: number;
  sortOrder: number;
  active: boolean;
};

export type CreateSubmoduleInput = {
  moduleId: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  accessLevel: number;
  sortOrder: number;
  active: boolean;
};

export type UpdateSubmoduleInput = {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  accessLevel: number;
  sortOrder: number;
  active: boolean;
};

export type RoleItem = {
  id: string;
  code: string;
  name: string;
};

export type ReorderSubmodulesInput = {
  moduleId: string;
  orderedSubmoduleIds: string[];
};

export type ReorderModulesInput = {
  roleCode: string;
  orderedModuleIds: string[];
};

type AdminModulesResponse = {
  tabs: AdminModuleTab[];
  message: string;
};

type RolesResponse = {
  roles: RoleItem[];
  message: string;
};

type CreateModuleResponse = {
  id: string;
  name: string;
  message: string;
};

type CreateSubmoduleResponse = {
  id: string;
  name: string;
  message: string;
};

type UpdateSubmoduleResponse = {
  id: string;
  name: string;
  message: string;
};

type ReorderSubmodulesResponse = {
  message: string;
};

type ReorderModulesResponse = {
  message: string;
};

export function useAdminModules() {
  const [tabs, setTabs] = useState<AdminModuleTab[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<AdminModulesResponse>('/admin/modules');
      setTabs(response.tabs ?? []);
      return response.tabs ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load modules.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setIsRolesLoading(true);
    setRolesError(null);

    try {
      const response = await apiRequest<RolesResponse>('/admin/roles');
      setRoles(response.roles ?? []);
      return response.roles ?? [];
    } catch (err) {
      setRoles([]);
      setRolesError(err instanceof Error ? err.message : 'Unable to load roles.');
      return [];
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  const createModule = useCallback(async (payload: CreateModuleInput) => {
    const response = await apiRequest<CreateModuleResponse>('/admin/modules', {
      method: 'POST',
      body: JSON.stringify({
        role_id: payload.roleId,
        code: payload.code,
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        path: payload.path,
        has_sub_modules: payload.hasSubModules,
        access_level: payload.accessLevel,
        sort_order: payload.sortOrder,
        active: payload.active,
      }),
    });

    await fetchModules();
    return response;
  }, [fetchModules]);

  const createSubmodule = useCallback(async (payload: CreateSubmoduleInput) => {
    const response = await apiRequest<CreateSubmoduleResponse>('/admin/modules/submodules', {
      method: 'POST',
      body: JSON.stringify({
        module_id: payload.moduleId,
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        url: payload.url,
        access_level: payload.accessLevel,
        sort_order: payload.sortOrder,
        active: payload.active,
      }),
    });

    await fetchModules();
    return response;
  }, [fetchModules]);

  const updateSubmodule = useCallback(async (payload: UpdateSubmoduleInput) => {
    const response = await apiRequest<UpdateSubmoduleResponse>(`/admin/modules/submodules/${payload.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        module_id: payload.moduleId,
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        url: payload.url,
        access_level: payload.accessLevel,
        sort_order: payload.sortOrder,
        active: payload.active,
      }),
    });

    await fetchModules();
    return response;
  }, [fetchModules]);

  const reorderSubmodules = useCallback(async (payload: ReorderSubmodulesInput) => {
    const response = await apiRequest<ReorderSubmodulesResponse>('/admin/modules/submodules/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        module_id: payload.moduleId,
        ordered_submodule_ids: payload.orderedSubmoduleIds,
      }),
    });

    await fetchModules();
    return response;
  }, [fetchModules]);

  const reorderModules = useCallback(async (payload: ReorderModulesInput) => {
    const response = await apiRequest<ReorderModulesResponse>('/admin/modules/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        role_code: payload.roleCode,
        ordered_module_ids: payload.orderedModuleIds,
      }),
    });

    await fetchModules();
    return response;
  }, [fetchModules]);

  return {
    tabs,
    roles,
    isLoading,
    isRolesLoading,
    error,
    rolesError,
    fetchModules,
    fetchRoles,
    createModule,
    createSubmodule,
    updateSubmodule,
    reorderModules,
    reorderSubmodules,
    clearError: () => setError(null),
  };
}
