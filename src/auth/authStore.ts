import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import type { AuthResponse, AuthUser, LoginPayload, MeResponse } from './types'

function getPrimaryRoleCode(user: AuthUser | null) {
  return user?.roles?.[0]?.code?.toLowerCase().trim() ?? null
}

type AuthStore = {
  user: AuthUser | null
  primaryRole: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  hydrateSession: () => Promise<AuthUser | null>
  login: (payload: LoginPayload) => Promise<AuthResponse>
  logout: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  primaryRole: null,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      primaryRole: getPrimaryRoleCode(user),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSession: () =>
    set({
      user: null,
      primaryRole: null,
    }),
  hydrateSession: async () => {
    set({ isLoading: true })

    try {
      const response = await apiRequest<MeResponse>('/auth/me')
      set({
        user: response.user,
        primaryRole: getPrimaryRoleCode(response.user),
      })

      return response.user
    } catch {
      set({
        user: null,
        primaryRole: null,
      })

      return null
    } finally {
      set({ isLoading: false })
    }
  },
  login: async (payload) => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    set({
      user: response.user,
      primaryRole: getPrimaryRoleCode(response.user),
    })

    return response
  },
  logout: async () => {
    try {
      await apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      set({
        user: null,
        primaryRole: null,
      })
    }
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('pos:session-invalidated', () => {
    useAuthStore.getState().clearSession()
  })
}
