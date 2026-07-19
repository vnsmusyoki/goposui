import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../auth/authStore';
import { getWorkspaceLabel, getWorkspaceSlug } from '../auth/workspace';
import { useModulesStore } from '../modules/modulesStore';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  LogOut,
  RefreshCw,
  BarChart3,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

// ============================================
// TYPES & CONSTANTS
// ============================================

type Theme = 'light' | 'dark' | 'system';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const toTitle = (value: string): string => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// ============================================
// DYNAMIC ICON COMPONENT
// ============================================

const DynamicIcon: React.FC<{
  iconName: string;
  size?: number;
  className?: string;
}> = ({ iconName, size = 20, className = '' }) => {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
  if (!IconComponent) return <BarChart3 size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};

// ============================================
// THEME SWITCHER COMPONENT
// ============================================

const ThemeSwitcher: React.FC<{ theme: Theme; onThemeChange: (theme: Theme) => void }> = ({ 
  theme, 
  onThemeChange 
}) => {
  const buttons = [
    { value: 'light' as const, icon: Sun, label: 'Light Mode' },
    { value: 'dark' as const, icon: Moon, label: 'Dark Mode' },
    { value: 'system' as const, icon: Monitor, label: 'System Preference' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm">
      {buttons.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onThemeChange(value)}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            theme === value
              ? 'bg-surface-alt text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={label}
          type="button"
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};


// ============================================
// MAIN APP LAYOUT COMPONENT
// ============================================

const AppLayout: React.FC = () => {
  // State
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const modules = useModulesStore((state) => state.modules);
  const refreshModules = useModulesStore((state) => state.refreshModules);
  const isModulesLoading = useModulesStore((state) => state.isLoading);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const sidebarRef = useRef<HTMLElement>(null);
  const menuSearchInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const workspaceRole = useMemo(() => getWorkspaceSlug(user), [user]);
  const workspaceLabel = useMemo(() => getWorkspaceLabel(user), [user]);
  const moduleGroups = useMemo(
    () => modules.filter((group) => group.items.length > 0),
    [modules],
  );
  const [openModuleKey, setOpenModuleKey] = useState<string | null | undefined>(undefined);

  // Memoized values
  const filteredModules = useMemo(() => {
    if (!menuSearch.trim()) return modules;
    const search = menuSearch.toLowerCase();
    return modules
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const parentMatch =
            item.name.toLowerCase().includes(search) ||
            (item.path ?? '').toLowerCase().includes(search);
          const childMatch = item.children?.some(
            (child) =>
              child.name.toLowerCase().includes(search) ||
              (child.path ?? '').toLowerCase().includes(search),
          );

          return parentMatch || Boolean(childMatch);
        }),
      }))
      .filter((group) => {
        const groupMatch = group.name.toLowerCase().includes(search);
        return groupMatch || group.items.length > 0;
      });
  }, [modules, menuSearch]);
  const filteredModuleGroups = useMemo(
    () => filteredModules.filter((group) => group.items.length > 0),
    [filteredModules],
  );
  const visibleOpenableModuleKeys = useMemo(
    () =>
      filteredModuleGroups
        .filter((group) => {
          const moduleItem = group.items[0];
          return Boolean(moduleItem?.hasSubModules && (moduleItem.children?.length ?? 0) > 0);
        })
        .map((group) => group.name),
    [filteredModuleGroups],
  );
  const activeModuleKey = useMemo(() => {
    for (const group of filteredModuleGroups) {
      const moduleItem = group.items[0];
      if (!moduleItem) {
        continue;
      }

      if (moduleItem.path && moduleItem.path === location.pathname) {
        return group.name;
      }

      if (moduleItem.children?.some((child) => child.path && child.path === location.pathname)) {
        return group.name;
      }
    }

    return null;
  }, [filteredModuleGroups, location.pathname]);
  const resolvedOpenModuleKey = useMemo(() => {
    if (openModuleKey === null) {
      return null;
    }

    if (openModuleKey && visibleOpenableModuleKeys.includes(openModuleKey)) {
      return openModuleKey;
    }

    if (activeModuleKey && visibleOpenableModuleKeys.includes(activeModuleKey)) {
      return activeModuleKey;
    }

    return openModuleKey === undefined ? visibleOpenableModuleKeys[0] ?? null : null;
  }, [activeModuleKey, openModuleKey, visibleOpenableModuleKeys]);

  useEffect(() => {
    if (visibleOpenableModuleKeys.length === 0) {
      if (openModuleKey !== null) {
        setOpenModuleKey(null);
      }
      return;
    }

    if (openModuleKey === null) {
      return;
    }

    if (activeModuleKey && visibleOpenableModuleKeys.includes(activeModuleKey)) {
      if (openModuleKey === undefined || !visibleOpenableModuleKeys.includes(openModuleKey)) {
        setOpenModuleKey(activeModuleKey);
      }
      return;
    }

    if (openModuleKey === undefined) {
      setOpenModuleKey(visibleOpenableModuleKeys[0]);
      return;
    }

    if (openModuleKey !== null && !visibleOpenableModuleKeys.includes(openModuleKey)) {
      setOpenModuleKey(visibleOpenableModuleKeys[0] ?? null);
    }
  }, [activeModuleKey, openModuleKey, visibleOpenableModuleKeys]);

  const routeInfo = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const section = segments[segments.length - 1] || "dashboard";
    return {
      category: workspaceLabel,
      title: toTitle(section)
    };
  }, [location.pathname, workspaceLabel]);

  // Handlers
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshedModules = await refreshModules();
      const refreshError = useModulesStore.getState().error;
      if (refreshError) {
        toast.error(refreshError);
      } else {
        toast.success(`Modules refreshed successfully `);
      }
    } catch {
      toast.error('Unable to refresh modules right now.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshModules]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  const clearMenuSearch = useCallback(() => {
    setMenuSearch('');
    menuSearchInputRef.current?.focus();
  }, []);

  const handleModuleHeaderClick = useCallback((groupName: string, hasChildren: boolean, path?: string) => {
    if (hasChildren) {
      setOpenModuleKey((current) => (current === groupName ? null : groupName));
      return;
    }

    if (path) {
      handleNavigation(path);
    }
  }, [handleNavigation]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Unable to log out right now.');
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  // Effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.menu-button')) {
          setSidebarOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Render sidebar navigation
  const renderSidebarNav = () => (
    <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
      {isModulesLoading && filteredModuleGroups.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Loading modules...
        </div>
      ) : filteredModuleGroups.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          No modules available for this workspace yet.
        </div>
      ) : filteredModuleGroups.map((group) => {
        const moduleItem = group.items[0];
        if (!moduleItem) {
          return null;
        }

        const hasChildren = Boolean(moduleItem.hasSubModules && (moduleItem.children?.length ?? 0) > 0);
        const isExpanded = resolvedOpenModuleKey === group.name;
        const isActiveParent =
          (moduleItem.path && moduleItem.path === location.pathname) ||
          Boolean(moduleItem.children?.some((child) => child.path && child.path === location.pathname));

        return (
        <div key={group.name} className={`${sidebarCollapsed ? 'hidden' : ''} mt-3 first:mt-0`}>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleModuleHeaderClick(group.name, hasChildren, moduleItem.path)}
              className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                isActiveParent
                  ? 'border border-border bg-surface-alt text-primary font-medium'
                  : 'text-foreground/75 hover:bg-surface-alt hover:text-foreground'
              }`}
              title={moduleItem.name}
            >
              <span className={`flex min-w-0 items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <DynamicIcon
                  iconName={moduleItem.icon ?? 'LayoutDashboard'}
                  size={20}
                  className="flex-shrink-0"
                />
                {!sidebarCollapsed && (
                  <span className="truncate text-sm font-medium">{moduleItem.name}</span>
                )}
              </span>
              {hasChildren && !sidebarCollapsed && (
                <ChevronRight
                  size={18}
                  className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                />
              )}
            </button>

            {hasChildren && isExpanded && !sidebarCollapsed && (
              <div className="ml-4 space-y-0.5 border-l border-border/70 pl-3">
                {moduleItem.children?.map((child) => (
                  <button
                    type="button"
                    key={`${group.name}-${child.path}`}
                    onClick={() => child.path && handleNavigation(child.path)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      location.pathname === child.path
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/75 hover:bg-surface-alt hover:text-foreground'
                    }`}
                    title={child.name}
                  >
                    <DynamicIcon
                      iconName={child.icon ?? moduleItem.icon ?? 'LayoutDashboard'}
                      size={18}
                      className="flex-shrink-0"
                    />
                    <span className="truncate">{child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="menu-button fixed left-4 top-4 z-50 rounded-lg border border-border bg-card p-2 text-foreground shadow-lg lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-border bg-card text-card-foreground
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo Section */}
        <div className="border-b border-border p-6">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation(`/${workspaceRole}/dashboard`)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-lg text-primary-foreground shadow-md">
                    P
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">POS Pro</div>
                    <div className="text-xs font-medium text-primary">Ecommerce</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Search */}
        {!sidebarCollapsed && (
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                ref={menuSearchInputRef}
                type="text"
                placeholder="Search menu..."
                className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={clearMenuSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        {renderSidebarNav()}

        {/* User Profile */}
        <div className="border-t border-border bg-surface-alt/40 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-md">
                    {(user?.fullName ?? 'User')
                      .split(' ')
                      .map((part) => part[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">{user?.fullName ?? 'John Doe'}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user?.roles?.[0]?.name ?? workspaceLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-danger"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-danger"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        min-h-screen transition-all duration-300
        ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
      `}>
        {/* Top Navigation */}
        <nav className="sticky top-0 z-30 border-b border-border bg-background/80 px-3 py-3 backdrop-blur-md md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-3">
            {/* Breadcrumb */}
            <div className="min-w-0 flex-1 pl-12 lg:pl-0">
              <div className="flex min-w-0 items-center space-x-1.5 text-xs text-muted-foreground sm:text-sm">
                <Home size={14} />
                <span>/</span>
                <span className="truncate">{routeInfo.category}</span>
                <span>/</span>
                <span className="truncate font-medium text-foreground">
                  {routeInfo.title}
                </span>
              </div>
              <h1 className="mt-1 truncate text-base font-bold text-foreground sm:text-xl">
                {routeInfo.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2 md:gap-3">
              {/* Global Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="w-64 rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher theme={theme} onThemeChange={handleThemeChange} />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-danger sm:flex"
                title="Logout"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="w-full py-0 px-3 sm:px-4 lg:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
