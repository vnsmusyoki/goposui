import type { AuthUser } from './types'

export type WorkspaceSlug = string

export function getWorkspaceSlug(user: AuthUser | null | undefined): WorkspaceSlug {
  const roleCodes = user?.roles?.map((role) => role.code.toLowerCase().trim()).filter(Boolean) ?? []

  if (roleCodes.includes('admin') || roleCodes.length === 0) {
    return 'admin'
  }

  return roleCodes[0]
}

export function getWorkspaceLabel(user: AuthUser | null | undefined): string {
  const workspace = getWorkspaceSlug(user)

  return `${workspace.charAt(0).toUpperCase()}${workspace.slice(1)} Workspace`
}
