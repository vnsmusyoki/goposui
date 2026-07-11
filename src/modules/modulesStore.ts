import { create } from 'zustand'
import { apiRequest, ApiError } from '../lib/api'
import type { NavigationGroupResponse, ModulesResponse } from '../auth/types'

type ModulesStore = {
  modules: NavigationGroupResponse[]
  isLoading: boolean
  error: string | null
  hydrateModules: () => Promise<NavigationGroupResponse[]>
  refreshModules: () => Promise<NavigationGroupResponse[]>
  clearModules: () => void
}

function applyModulesPayload(
  set: (partial: Partial<ModulesStore>) => void,
  payload: ModulesResponse,
) {
  set({
    modules: payload.modules ?? [],
    error: null,
  })
}

export const useModulesStore = create<ModulesStore>((set) => ({
  modules: [],
  isLoading: false,
  error: null,
  clearModules: () =>
    set({
      modules: [],
      isLoading: false,
      error: null,
    }),
  hydrateModules: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiRequest<ModulesResponse>('/auth/modules')
      applyModulesPayload(set, response)
      return response.modules ?? []
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({
          modules: [],
          error: null,
        })
      } else {
        set({
          error: error instanceof Error ? error.message : 'Unable to load modules.',
        })
      }

      return []
    } finally {
      set({ isLoading: false })
    }
  },
  refreshModules: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiRequest<ModulesResponse>('/auth/modules')
      applyModulesPayload(set, response)
      return response.modules ?? []
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to refresh modules.',
      })
      return []
    } finally {
      set({ isLoading: false })
    }
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('pos:session-invalidated', () => {
    useModulesStore.getState().clearModules()
  })
}
