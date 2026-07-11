import React, { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Select, { type StylesConfig } from 'react-select';
import * as Icons from 'lucide-react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  FolderTree,
  Home,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
  Move,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import {
  useAdminModules,
  type AdminModuleItem,
  type AdminModuleTab,
  type CreateModuleInput,
  type CreateSubmoduleInput,
  type UpdateSubmoduleInput,
} from '@/hooks/admin/modules/useAdminModules';

type IconProps = {
  iconName: string;
  className?: string;
};

const selectTabs = (tabs: AdminModuleTab[]) => {
  const tabMap = new Map(tabs.map((tab) => [tab.key.toLowerCase(), tab]));
  return ['admin', 'business'].map((key) => {
    const existing = tabMap.get(key);
    return (
      existing ?? {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        modules: [],
      }
    );
  });
};

const ModuleIcon = ({ iconName, className = 'h-5 w-5' }: IconProps) => {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || FolderTree;
  return <IconComponent className={className} />;
};

const statusStyles = (active: boolean) =>
  active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground';

type SelectOption = {
  value: string;
  label: string;
};

const ToggleSwitch = ({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const selectStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
    ':hover': {
      borderColor: 'hsl(var(--primary))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  input: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--muted))'
        : 'transparent',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    ':active': {
      backgroundColor: 'hsl(var(--primary) / 0.9)',
      color: 'hsl(var(--primary-foreground))',
    },
  }),
  indicatorsContainer: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    ':hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--border))',
  }),
};

type ModuleFormState = CreateModuleInput;
type SubmoduleFormState = CreateSubmoduleInput;

const emptyModuleForm = (): ModuleFormState => ({
  roleId: '',
  code: '',
  name: '',
  description: '',
  icon: '',
  path: '',
  hasSubModules: true,
  accessLevel: 1,
  sortOrder: 0,
  active: true,
});

const emptySubmoduleForm = (moduleId = '', sortOrder = 0): SubmoduleFormState => ({
  moduleId,
  name: '',
  description: '',
  icon: '',
  url: '',
  accessLevel: 1,
  sortOrder,
  active: true,
});

const findSubmoduleContext = (tabs: AdminModuleTab[], submoduleId: string) => {
  for (const tab of tabs) {
    for (const module of tab.modules) {
      const submodule = module.submodules.find((item) => item.id === submoduleId);
      if (submodule) {
        return { tabKey: tab.key, module, submodule };
      }
    }
  }

  return null;
};

export default function AdminModuleList() {
  const {
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
  } = useAdminModules();
  const [activeTab, setActiveTab] = useState('admin');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isSubmoduleModalOpen, setIsSubmoduleModalOpen] = useState(false);
  const [submoduleModalMode, setSubmoduleModalMode] = useState<'create' | 'edit'>('create');
  const [editingSubmoduleId, setEditingSubmoduleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm);
  const [submoduleForm, setSubmoduleForm] = useState<SubmoduleFormState>(emptySubmoduleForm);
  const [moduleFormErrors, setModuleFormErrors] = useState<Record<string, string | undefined>>({});
  const [submoduleFormErrors, setSubmoduleFormErrors] = useState<Record<string, string | undefined>>({});
  const [savingModule, setSavingModule] = useState(false);
  const [savingSubmodule, setSavingSubmodule] = useState(false);
  const [draggedModule, setDraggedModule] = useState<{ roleCode: string; moduleId: string } | null>(null);
  const [draggedSubmodule, setDraggedSubmodule] = useState<{ moduleId: string; submoduleId: string } | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void fetchModules();
    void fetchRoles();
  }, [fetchModules, fetchRoles]);

  useEffect(() => {
    if (isModuleModalOpen && roles.length === 0 && !isRolesLoading && !rolesError) {
      void fetchRoles();
    }
  }, [fetchRoles, isModuleModalOpen, isRolesLoading, roles.length, rolesError]);

  const visibleTabs = useMemo(() => selectTabs(tabs), [tabs]);
  const currentTab = useMemo(() => {
    const matchedTab = visibleTabs.find((tab) => tab.key === activeTab);
    return matchedTab ?? visibleTabs[0];
  }, [visibleTabs, activeTab]);
  const parentModuleOptions = useMemo<SelectOption[]>(
    () =>
      (currentTab?.modules ?? []).map((module) => ({
        value: module.id,
        label: module.name,
      })),
    [currentTab],
  );
  const selectedParentModule = useMemo<SelectOption | null>(
    () => parentModuleOptions.find((option) => option.value === submoduleForm.moduleId) ?? null,
    [parentModuleOptions, submoduleForm.moduleId],
  );
  const roleOptions = useMemo<SelectOption[]>(
    () => roles.map((role) => ({ value: role.id, label: `${role.name} (${role.code})` })),
    [roles],
  );
  const selectedRoleOption = useMemo<SelectOption | null>(
    () => roleOptions.find((option) => option.value === moduleForm.roleId) ?? null,
    [roleOptions, moduleForm.roleId],
  );
  const filteredModules = useMemo(() => {
    const modules = currentTab?.modules ?? [];
    if (!searchTerm.trim()) {
      return modules;
    }

    const searchLower = searchTerm.toLowerCase();
    return modules.filter((module) => {
      const moduleMatches =
        module.name.toLowerCase().includes(searchLower) ||
        module.code.toLowerCase().includes(searchLower) ||
        module.description.toLowerCase().includes(searchLower) ||
        module.path.toLowerCase().includes(searchLower);

      if (moduleMatches) {
        return true;
      }

      return module.submodules.some(
        (submodule) =>
          submodule.name.toLowerCase().includes(searchLower) ||
          submodule.code.toLowerCase().includes(searchLower) ||
          submodule.url.toLowerCase().includes(searchLower),
      );
    });
  }, [currentTab, searchTerm]);

  const totals = useMemo(() => {
    const modules = currentTab?.modules ?? [];
    return {
      modules: modules.length,
      submodules: modules.reduce((sum, module) => sum + module.submodules.length, 0),
      activeModules: modules.filter((module) => module.active).length,
      activeSubmodules: modules.reduce(
        (sum, module) => sum + module.submodules.filter((submodule) => submodule.active).length,
        0,
      ),
    };
  }, [currentTab]);

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getNextSubmoduleSortOrder = (moduleId: string) => {
    const selectedModule = currentTab?.modules.find((module) => module.id === moduleId);
    if (!selectedModule || selectedModule.submodules.length === 0) {
      return 1;
    }

    return Math.max(...selectedModule.submodules.map((submodule) => submodule.sortOrder)) + 1;
  };

  const closeModuleModal = () => {
    setIsModuleModalOpen(false);
    setModuleForm(emptyModuleForm());
    setModuleFormErrors({});
  };

  const closeSubmoduleModal = () => {
    setIsSubmoduleModalOpen(false);
    setSubmoduleModalMode('create');
    setEditingSubmoduleId(null);
    setSubmoduleForm(emptySubmoduleForm());
    setSubmoduleFormErrors({});
  };

  const openSubmoduleModal = (module: AdminModuleItem) => {
    setSubmoduleModalMode('create');
    setEditingSubmoduleId(null);
    setSubmoduleForm(emptySubmoduleForm(module.id, getNextSubmoduleSortOrder(module.id)));
    setSubmoduleFormErrors({});
    setIsSubmoduleModalOpen(true);
  };

  const openEditSubmoduleModal = (submoduleId: string) => {
    const context = findSubmoduleContext(visibleTabs, submoduleId);
    if (!context) {
      toast.error('Unable to load submodule details.');
      return;
    }

    setActiveTab(context.tabKey);
    setExpandedModules(new Set([context.module.id]));
    setSubmoduleModalMode('edit');
    setEditingSubmoduleId(context.submodule.id);
    setSubmoduleForm({
      moduleId: context.module.id,
      name: context.submodule.name,
      description: context.submodule.description ?? '',
      icon: context.submodule.icon ?? '',
      url: context.submodule.url,
      accessLevel: context.submodule.accessLevel,
      sortOrder: context.submodule.sortOrder,
      active: context.submodule.active,
    });
    setSubmoduleFormErrors({});
    setIsSubmoduleModalOpen(true);
  };

  const getReorderedSubmoduleIds = (submodules: AdminModuleItem['submodules'], sourceId: string, targetId: string) => {
    const sourceIndex = submodules.findIndex((submodule) => submodule.id === sourceId);
    const targetIndex = submodules.findIndex((submodule) => submodule.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return null;
    }

    const nextSubmodules = [...submodules];
    const [moved] = nextSubmodules.splice(sourceIndex, 1);
    nextSubmodules.splice(targetIndex, 0, moved);
    return nextSubmodules.map((submodule) => submodule.id);
  };

  const persistSubmoduleOrder = async (module: AdminModuleItem, sourceId: string, targetId: string) => {
    const orderedSubmoduleIds = getReorderedSubmoduleIds(module.submodules, sourceId, targetId);
    if (!orderedSubmoduleIds) {
      return;
    }

    const hasChanged = orderedSubmoduleIds.some((id, index) => id !== module.submodules[index]?.id);
    if (!hasChanged) {
      return;
    }

    try {
      await reorderSubmodules({
        moduleId: module.id,
        orderedSubmoduleIds,
      });
      toast.success('Submodules reordered successfully.');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Unable to reorder submodules.');
    } finally {
      setDraggedSubmodule(null);
    }
  };

  const getReorderedModuleIds = (modules: AdminModuleItem[], sourceId: string, targetId: string) => {
    const sourceIndex = modules.findIndex((module) => module.id === sourceId);
    const targetIndex = modules.findIndex((module) => module.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return null;
    }

    const nextModules = [...modules];
    const [moved] = nextModules.splice(sourceIndex, 1);
    nextModules.splice(targetIndex, 0, moved);
    return nextModules.map((module) => module.id);
  };

  const persistModuleOrder = async (roleCode: string, sourceId: string, targetId: string) => {
    const modules = currentTab?.modules ?? [];
    const orderedModuleIds = getReorderedModuleIds(modules, sourceId, targetId);
    if (!orderedModuleIds) {
      return;
    }

    const hasChanged = orderedModuleIds.some((id, index) => id !== modules[index]?.id);
    if (!hasChanged) {
      return;
    }

    try {
      await reorderModules({
        roleCode,
        orderedModuleIds,
      });
      toast.success('Modules reordered successfully.');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Unable to reorder modules.');
    } finally {
      setDraggedModule(null);
    }
  };

  const validateModuleForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!moduleForm.roleId.trim()) {
      nextErrors.roleId = 'Role is required.';
    }
    if (!moduleForm.code.trim()) {
      nextErrors.code = 'Module code is required.';
    }
    if (!moduleForm.name.trim()) {
      nextErrors.name = 'Module name is required.';
    }
    if (!moduleForm.path.trim()) {
      nextErrors.path = 'Module path is required.';
    }
    if (moduleForm.accessLevel !== 1 && moduleForm.accessLevel !== 2) {
      nextErrors.accessLevel = 'Access level must be 1 or 2.';
    }
    if (moduleForm.sortOrder < 0) {
      nextErrors.sortOrder = 'Sort order cannot be negative.';
    }

    return nextErrors;
  };

  const validateSubmoduleForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!submoduleForm.moduleId.trim()) {
      nextErrors.moduleId = 'Parent module is required.';
    }
    if (!submoduleForm.name.trim()) {
      nextErrors.name = 'Submodule name is required.';
    }
    if (!submoduleForm.url.trim()) {
      nextErrors.url = 'Submodule URL is required.';
    }
    if (!submoduleForm.icon.trim()) {
      nextErrors.icon = 'Icon is required.';
    }
    if (submoduleForm.accessLevel !== 1 && submoduleForm.accessLevel !== 2) {
      nextErrors.accessLevel = 'Access level must be 1 or 2.';
    }
    if (submoduleForm.sortOrder < 0) {
      nextErrors.sortOrder = 'Sort order cannot be negative.';
    }

    return nextErrors;
  };

  const handleCreateModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateModuleForm();
    setModuleFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted module fields.');
      return;
    }

    setSavingModule(true);

    try {
      await createModule({
        roleId: moduleForm.roleId.trim(),
        code: moduleForm.code.trim(),
        name: moduleForm.name.trim(),
        description: moduleForm.description.trim(),
        icon: moduleForm.icon.trim(),
        path: moduleForm.path.trim(),
        hasSubModules: moduleForm.hasSubModules,
        accessLevel: moduleForm.accessLevel,
        sortOrder: Math.max(0, Number(moduleForm.sortOrder) || 0),
        active: moduleForm.active,
      });
      toast.success('Module created successfully.');
      closeModuleModal();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError instanceof ApiError && apiError.data && typeof apiError.data === 'object') {
        const responseErrors = (apiError.data as { errors?: Record<string, string> }).errors;
        if (responseErrors) {
          setModuleFormErrors(responseErrors);
        }
      }
      toast.error(apiError.message || 'Unable to create module.');
    } finally {
      setSavingModule(false);
    }
  };

  const handleCreateSubmodule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateSubmoduleForm();
    setSubmoduleFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted submodule fields.');
      return;
    }

    setSavingSubmodule(true);

    try {
      if (submoduleModalMode === 'edit' && editingSubmoduleId) {
        await updateSubmodule({
          id: editingSubmoduleId,
          moduleId: submoduleForm.moduleId.trim(),
          name: submoduleForm.name.trim(),
          description: submoduleForm.description.trim(),
          icon: submoduleForm.icon.trim(),
          url: submoduleForm.url.trim(),
          accessLevel: submoduleForm.accessLevel,
          sortOrder: Math.max(0, Number(submoduleForm.sortOrder) || 0),
          active: submoduleForm.active,
        } satisfies UpdateSubmoduleInput);
        toast.success('Submodule updated successfully.');
      } else {
        await createSubmodule({
          moduleId: submoduleForm.moduleId.trim(),
          name: submoduleForm.name.trim(),
          description: submoduleForm.description.trim(),
          icon: submoduleForm.icon.trim(),
          url: submoduleForm.url.trim(),
          accessLevel: submoduleForm.accessLevel,
          sortOrder: Math.max(0, Number(submoduleForm.sortOrder) || 0),
          active: submoduleForm.active,
        });
        toast.success('Submodule created successfully.');
      }
      closeSubmoduleModal();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError instanceof ApiError && apiError.data && typeof apiError.data === 'object') {
        const responseErrors = (apiError.data as { errors?: Record<string, string> }).errors;
        if (responseErrors) {
          setSubmoduleFormErrors(responseErrors);
        }
      }
      toast.error(apiError.message || 'Unable to create submodule.');
    } finally {
      setSavingSubmodule(false);
    }
  };

  const renderModuleRow = (module: AdminModuleItem) => {
    const isExpanded = expandedModules.has(module.id);
    const hasChildren = module.submodules.length > 0;
    const isDraggingModule = draggedModule?.moduleId === module.id;

    return (
      <React.Fragment key={module.id}>
        <tr
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', module.id);
            setDraggedModule({ roleCode: currentTab?.key ?? module.roleCode, moduleId: module.id });
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!draggedModule || draggedModule.moduleId === module.id) {
              return;
            }
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (!draggedModule || draggedModule.moduleId === module.id) {
              return;
            }
            void persistModuleOrder(draggedModule.roleCode, draggedModule.moduleId, module.id);
          }}
          onDragEnd={() => setDraggedModule(null)}
          className={`border-b border-border transition-colors hover:bg-surface-alt/60 ${
            isDraggingModule ? 'opacity-60' : ''
          } ${draggedModule ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <td className="px-4 py-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => hasChildren && toggleExpanded(module.id)}
                className={`mt-0.5 rounded p-1 transition-colors ${
                  hasChildren ? 'hover:bg-surface-alt' : 'cursor-default opacity-0'
                }`}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                ) : null}
              </button>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ModuleIcon iconName={module.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{module.name}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {module.roleName}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${module.hasSubModules ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {module.hasSubModules ? 'Has Sub Modules' : 'No Sub Modules'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles(module.active)}`}>
                    {module.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-4 text-sm text-foreground">{module.code}</td>
          <td className="px-4 py-4 text-sm text-muted-foreground">{module.path || 'No path configured'}</td>
          <td className="px-4 py-4 text-sm text-foreground">{module.accessLevel}</td>
          <td className="px-4 py-4 text-sm text-foreground">{module.sortOrder}</td>
          <td className="px-4 py-4">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles(module.active)}`}>
              {module.active ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Inactive
                </>
              )}
            </span>
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                disabled
                title="Edit module coming soon"
                className="rounded p-1.5 text-muted-foreground opacity-50"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openSubmoduleModal(module)}
                title="Add submodule"
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Drag to reorder"
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', module.id);
                  setDraggedModule({ roleCode: currentTab?.key ?? module.roleCode, moduleId: module.id });
                }}
              >
                <Move className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled
                title="Delete module coming soon"
                className="rounded p-1.5 text-muted-foreground opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" disabled className="rounded p-1.5 text-muted-foreground opacity-50">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded &&
          module.submodules.map((submodule) => (
            <tr
              key={submodule.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', submodule.id);
                setDraggedSubmodule({ moduleId: module.id, submoduleId: submodule.id });
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!draggedSubmodule || draggedSubmodule.moduleId !== module.id || draggedSubmodule.submoduleId === submodule.id) {
                  return;
                }
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggedSubmodule || draggedSubmodule.moduleId !== module.id) {
                  return;
                }
                void persistSubmoduleOrder(module, draggedSubmodule.submoduleId, submodule.id);
              }}
              onDragEnd={() => setDraggedSubmodule(null)}
              className={`border-b border-border/70 bg-surface-alt/30 transition-colors ${
                draggedSubmodule?.submoduleId === submodule.id ? 'opacity-60' : ''
              } ${draggedSubmodule && draggedSubmodule.moduleId === module.id ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-start gap-3 pl-10">
                  <div className="rounded-md border border-dashed border-border bg-background p-2 text-muted-foreground">
                    <ModuleIcon iconName={submodule.icon || module.icon} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{submodule.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{submodule.url}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{submodule.code}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{submodule.url}</td>
              <td className="px-4 py-3 text-sm text-foreground">{submodule.accessLevel}</td>
              <td className="px-4 py-3 text-sm text-foreground">{submodule.sortOrder}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles(submodule.active)}`}>
                  {submodule.active ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Inactive
                    </>
                  )}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1 pr-1">
                  <button
                    type="button"
                    title="Drag to reorder"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
                  >
                    <Move className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditSubmoduleModal(submodule.id)}
                    title="Edit submodule"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button type="button" disabled className="rounded p-1.5 text-muted-foreground opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
      </React.Fragment>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FolderTree className="h-6 w-6 text-primary" />
            Module Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            View and prepare module and submodule structures for Admin and Business roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModuleModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
          <button
            type="button"
            onClick={() => void fetchModules()}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Modules</p>
          <p className="text-2xl font-bold text-foreground">{totals.modules}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Submodules</p>
          <p className="text-2xl font-bold text-foreground">{totals.submodules}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Modules</p>
          <p className="text-2xl font-bold text-success">{totals.activeModules}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Submodules</p>
          <p className="text-2xl font-bold text-primary">{totals.activeSubmodules}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setExpandedModules(new Set());
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:bg-surface-alt'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search modules or submodules..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
            <FolderTree className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No modules found</p>
            <p className="text-sm">
              {searchTerm ? 'Try a different search term.' : 'No modules are available for this tab yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Module
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Path
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Access
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sort
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredModules.map((module) => renderModuleRow(module))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Add Module</h2>
                <p className="text-sm text-muted-foreground">Provide the module details for the selected role.</p>
              </div>
              <button type="button" onClick={closeModuleModal} className="rounded p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateModule}>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Role</span>
                <Select<SelectOption, false>
                  inputId="module-role"
                  instanceId="module-role"
                  options={roleOptions}
                  value={selectedRoleOption}
                  onChange={(option) => {
                    setModuleForm((current) => ({ ...current, roleId: option?.value ?? '' }));
                    setModuleFormErrors((current) => ({ ...current, roleId: undefined }));
                  }}
                  placeholder="Select a role..."
                  isClearable
                  isSearchable
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
                {moduleFormErrors.roleId && <p className="text-xs text-red-500">{moduleFormErrors.roleId}</p>}
                {!moduleFormErrors.roleId && rolesError && (
                  <p className="text-xs text-red-500">{rolesError}</p>
                )}
                {!moduleFormErrors.roleId && !rolesError && roles.length === 0 && !isRolesLoading && (
                  <p className="text-xs text-muted-foreground">
                    No roles loaded yet. If this persists, confirm `/api/admin/roles` returns data for the current user.
                  </p>
                )}
                {isRolesLoading && (
                  <p className="text-xs text-muted-foreground">Loading roles...</p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Module Code</span>
                <input
                  value={moduleForm.code}
                  onChange={(event) => {
                    setModuleForm((current) => ({ ...current, code: event.target.value }));
                    setModuleFormErrors((current) => ({ ...current, code: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    moduleFormErrors.code ? 'border-red-400' : 'border-border'
                  }`}
                />
                {moduleFormErrors.code && <p className="text-xs text-red-500">{moduleFormErrors.code}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Module Name</span>
                <input
                  value={moduleForm.name}
                  onChange={(event) => {
                    setModuleForm((current) => ({ ...current, name: event.target.value }));
                    setModuleFormErrors((current) => ({ ...current, name: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    moduleFormErrors.name ? 'border-red-400' : 'border-border'
                  }`}
                />
                {moduleFormErrors.name && <p className="text-xs text-red-500">{moduleFormErrors.name}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Path</span>
                <input
                  value={moduleForm.path}
                  onChange={(event) => {
                    setModuleForm((current) => ({ ...current, path: event.target.value }));
                    setModuleFormErrors((current) => ({ ...current, path: undefined }));
                  }}
                  placeholder="/admin/modules"
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    moduleFormErrors.path ? 'border-red-400' : 'border-border'
                  }`}
                />
                {moduleFormErrors.path && <p className="text-xs text-red-500">{moduleFormErrors.path}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Icon</span>
                <input
                  value={moduleForm.icon}
                  onChange={(event) => {
                    setModuleForm((current) => ({ ...current, icon: event.target.value }));
                    setModuleFormErrors((current) => ({ ...current, icon: undefined }));
                  }}
                  placeholder="folder-tree"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="md:col-span-2">
                <ToggleSwitch
                  label="Has Sub Modules"
                  checked={moduleForm.hasSubModules}
                  onChange={(checked) => setModuleForm((current) => ({ ...current, hasSubModules: checked }))}
                  description="Turn this on if the module contains sub modules."
                />
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Access Level</span>
                <Select<SelectOption, false>
                  inputId="module-access-level"
                  instanceId="module-access-level"
                  options={[
                    { value: '1', label: 'Level 1' },
                    { value: '2', label: 'Level 2' },
                  ]}
                  value={{ value: String(moduleForm.accessLevel), label: `Level ${moduleForm.accessLevel}` }}
                  onChange={(option) => {
                    const nextValue = option?.value === '2' ? 2 : 1;
                    setModuleForm((current) => ({ ...current, accessLevel: nextValue }));
                    setModuleFormErrors((current) => ({ ...current, accessLevel: undefined }));
                  }}
                  placeholder="Select access level..."
                  isClearable={false}
                  isSearchable={false}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
                {moduleFormErrors.accessLevel && <p className="text-xs text-red-500">{moduleFormErrors.accessLevel}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Sort Order</span>
                <input
                  type="number"
                  min={0}
                  value={moduleForm.sortOrder}
                  onChange={(event) => {
                    setModuleForm((current) => ({ ...current, sortOrder: Number(event.target.value) }));
                    setModuleFormErrors((current) => ({ ...current, sortOrder: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    moduleFormErrors.sortOrder ? 'border-red-400' : 'border-border'
                  }`}
                />
                {moduleFormErrors.sortOrder && <p className="text-xs text-red-500">{moduleFormErrors.sortOrder}</p>}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  value={moduleForm.description}
                  onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={moduleForm.active}
                  onChange={(event) => setModuleForm((current) => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Mark module as active</span>
              </label>

              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeModuleModal}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModule}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingModule ? 'Saving...' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubmoduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {submoduleModalMode === 'edit' ? 'Edit Submodule' : 'Add Submodule'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {submoduleModalMode === 'edit'
                    ? 'Update the submodule details below.'
                    : 'This submodule will be created under the selected module.'}
                </p>
              </div>
              <button type="button" onClick={closeSubmoduleModal} className="rounded p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSubmodule}>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Parent Module</span>
                <Select<SelectOption, false>
                  inputId="submodule-parent-module"
                  instanceId="submodule-parent-module"
                  options={parentModuleOptions}
                  value={selectedParentModule}
                  onChange={(option) => {
                    const nextModuleId = option?.value ?? '';
                    setSubmoduleForm((current) => ({
                      ...current,
                      moduleId: nextModuleId,
                      sortOrder: nextModuleId ? getNextSubmoduleSortOrder(nextModuleId) : current.sortOrder,
                    }));
                    setSubmoduleFormErrors((current) => ({ ...current, moduleId: undefined }));
                  }}
                  placeholder="Search and select a module..."
                  isClearable
                  isSearchable
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
                {submoduleFormErrors.moduleId && <p className="text-xs text-red-500">{submoduleFormErrors.moduleId}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Submodule Name</span>
                <input
                  value={submoduleForm.name}
                  onChange={(event) => {
                    setSubmoduleForm((current) => ({ ...current, name: event.target.value }));
                    setSubmoduleFormErrors((current) => ({ ...current, name: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    submoduleFormErrors.name ? 'border-red-400' : 'border-border'
                  }`}
                />
                {submoduleFormErrors.name && <p className="text-xs text-red-500">{submoduleFormErrors.name}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">URL</span>
                <input
                  value={submoduleForm.url}
                  onChange={(event) => {
                    setSubmoduleForm((current) => ({ ...current, url: event.target.value }));
                    setSubmoduleFormErrors((current) => ({ ...current, url: undefined }));
                  }}
                  placeholder="/admin/modules/sub"
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    submoduleFormErrors.url ? 'border-red-400' : 'border-border'
                  }`}
                />
                {submoduleFormErrors.url && <p className="text-xs text-red-500">{submoduleFormErrors.url}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Icon</span>
                <input
                  value={submoduleForm.icon}
                  onChange={(event) => {
                    setSubmoduleForm((current) => ({ ...current, icon: event.target.value }));
                    setSubmoduleFormErrors((current) => ({ ...current, icon: undefined }));
                  }}
                  placeholder="e.g. FolderTree, Box, Package"
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    submoduleFormErrors.icon ? 'border-red-400' : 'border-border'
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  Use a Lucide React icon name. Make sure that icon exists in `lucide-react`.
                </p>
                {submoduleFormErrors.icon && <p className="text-xs text-red-500">{submoduleFormErrors.icon}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Access Level</span>
                <Select<SelectOption, false>
                  inputId="submodule-access-level"
                  instanceId="submodule-access-level"
                  options={[
                    { value: '1', label: 'Level 1' },
                    { value: '2', label: 'Level 2' },
                  ]}
                  value={{ value: String(submoduleForm.accessLevel), label: `Level ${submoduleForm.accessLevel}` }}
                  onChange={(option) => {
                    const nextValue = option?.value === '2' ? 2 : 1;
                    setSubmoduleForm((current) => ({ ...current, accessLevel: nextValue }));
                    setSubmoduleFormErrors((current) => ({ ...current, accessLevel: undefined }));
                  }}
                  placeholder="Select access level..."
                  isClearable={false}
                  isSearchable={false}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
                {submoduleFormErrors.accessLevel && <p className="text-xs text-red-500">{submoduleFormErrors.accessLevel}</p>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Sort Order</span>
                <input
                  type="number"
                  min={0}
                  value={submoduleForm.sortOrder}
                  onChange={(event) => {
                    setSubmoduleForm((current) => ({ ...current, sortOrder: Math.max(0, Number(event.target.value) || 0) }));
                    setSubmoduleFormErrors((current) => ({ ...current, sortOrder: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    submoduleFormErrors.sortOrder ? 'border-red-400' : 'border-border'
                  }`}
                />
                {submoduleFormErrors.sortOrder && <p className="text-xs text-red-500">{submoduleFormErrors.sortOrder}</p>}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  value={submoduleForm.description}
                  onChange={(event) => setSubmoduleForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="md:col-span-2">
                <ToggleSwitch
                  label="On / Off"
                  checked={submoduleForm.active}
                  onChange={(checked) => setSubmoduleForm((current) => ({ ...current, active: checked }))}
                  description="Turn this submodule on or off."
                />
              </div>

              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeSubmoduleModal}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSubmodule}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingSubmodule ? 'Saving...' : submoduleModalMode === 'edit' ? 'Update Submodule' : 'Create Submodule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
