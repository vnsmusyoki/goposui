import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from './authStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession)

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  return children
}

export function useAuth() {
  return useAuthStore((state) => state)
}
