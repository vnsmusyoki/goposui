import type { AuthUser } from './types'

export type WorkspaceSlug = string

export function getWorkspaceSlug(user: AuthUser | null | undefined): WorkspaceSlug {
  const roleCodes = user?.roles?.map((role) => role.code.toLowerCase().trim()).filter(Boolean) ?? []

  if (roleCodes.includes('admin') || roleCodes.length === 0) {
    return 'admin'
  }

  return roleCodes[0]
}

export function getWorkspaceBasePath(user: AuthUser | null | undefined): string {
  const workspace = getWorkspaceSlug(user)
  return workspace ? `/${workspace}` : '/admin'
}

export function normalizeWorkspacePath(user: AuthUser | null | undefined, path?: string): string {
  const trimmedPath = (path ?? '').trim()
  const basePath = getWorkspaceBasePath(user)

  if (!trimmedPath) {
    return `${basePath}/dashboard`
  }

  if (trimmedPath.startsWith('/admin') || trimmedPath.startsWith('/business')) {
    return trimmedPath
  }

  if (trimmedPath === '/') {
    return `${basePath}/dashboard`
  }

  return `${basePath}${trimmedPath.startsWith('/') ? '' : '/'}${trimmedPath}`
}

export function getWorkspaceLandingPath(user: AuthUser | null | undefined): string {
  const modulePath = user?.landingPath ?? user?.modules?.[0]?.path

  return normalizeWorkspacePath(user, modulePath)
}

export function getWorkspaceLabel(user: AuthUser | null | undefined): string {
  const workspace = getWorkspaceSlug(user)

  return `${workspace.charAt(0).toUpperCase()}${workspace.slice(1)} Workspace`
}
