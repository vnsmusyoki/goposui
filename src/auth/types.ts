export type ThemeName = 'light' | 'dark' | 'system'

export type RoleResponse = {
  id: string
  code: string
  name: string
}

export type SubmoduleResponse = {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  path: string
  sortOrder: number
}

export type ModuleResponse = {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  path: string
  sortOrder: number
  children?: SubmoduleResponse[]
}

export type NavigationItemResponse = {
  name: string
  icon?: string
  path?: string
  hasSubModules?: boolean
  children?: NavigationItemResponse[]
}

export type NavigationGroupResponse = {
  name: string
  items: NavigationItemResponse[]
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  isActive: boolean
  roles: RoleResponse[]
  modules: ModuleResponse[]
  landingPath?: string
  activeBusinessId?: string
}

export type ModulesResponse = {
  modules: NavigationGroupResponse[]
}

export type LoginPayload = {
  email: string
  password: string
  rememberMe: boolean
}

export type AuthResponse = {
  message: string
  user: AuthUser
  expiresAt: string
}

export type MeResponse = {
  user: AuthUser
  expiresAt: string
}
