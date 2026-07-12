import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from './authStore'
import { useModulesStore } from '../modules/modulesStore'
import { useBusinessStore } from '@/business/businessStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession)
  const user = useAuthStore((state) => state.user)
  const hydrateModules = useModulesStore((state) => state.hydrateModules)
  const clearModules = useModulesStore((state) => state.clearModules)
  const loadBusinessSettings = useBusinessStore((state) => state.loadBusinessSettings)
  const clearBusinessSettings = useBusinessStore((state) => state.clearBusinessSettings)

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    if (user) {
      void hydrateModules()
      void loadBusinessSettings()
      return
    }

    clearModules()
    clearBusinessSettings()
  }, [user, hydrateModules, clearModules, loadBusinessSettings, clearBusinessSettings])

  return children
}

export function useAuth() {
  return useAuthStore((state) => state)
}
