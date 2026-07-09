import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from './authStore'
import { useModulesStore } from '../modules/modulesStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession)
  const user = useAuthStore((state) => state.user)
  const hydrateModules = useModulesStore((state) => state.hydrateModules)
  const clearModules = useModulesStore((state) => state.clearModules)

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    if (user) {
      void hydrateModules()
      return
    }

    clearModules()
  }, [user, hydrateModules, clearModules])

  return children
}

export function useAuth() {
  return useAuthStore((state) => state)
}
