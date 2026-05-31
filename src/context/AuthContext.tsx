'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  logoutPending: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>
  register: (name: string, email: string, password: string, rememberMe: boolean) => Promise<void>
  logout: () => Promise<void>
  getAuthHeaders: () => HeadersInit
}

const USER_KEY = 'finfamilia_user'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function persistAuth(user: AuthUser, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage
  const clearStorage = rememberMe ? sessionStorage : localStorage

  clearStorage.removeItem(USER_KEY)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

function clearAuthStorage() {
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutPending, setLogoutPending] = useState(false)

  const loadStoredSession = useCallback(async () => {
    const localUser = localStorage.getItem(USER_KEY)
    const sessionUser = sessionStorage.getItem(USER_KEY)
    const storedUser = localUser ?? sessionUser
    const rememberMe = Boolean(localUser)
    // Do not mark user as authenticated from storage alone.
    // Session must be validated by backend (/api/auth/me).
    if (storedUser) {
      try {
        JSON.parse(storedUser)
      } catch {
        localStorage.removeItem(USER_KEY)
        sessionStorage.removeItem(USER_KEY)
      }
    }

    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Sessao invalida')

      const data = await response.json()
      setUser(data.user)
      persistAuth(data.user, rememberMe)
    } catch {
      clearAuthStorage()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      loadStoredSession()
    })
  }, [loadStoredSession])

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao entrar')
      }

      persistAuth(data.user, rememberMe)
      setUser(data.user)
      router.replace('/')
    },
    [router]
  )

  const register = useCallback(
    async (name: string, email: string, password: string, rememberMe: boolean) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, rememberMe }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao cadastrar')
      }

      persistAuth(data.user, rememberMe)
      setUser(data.user)
      router.replace('/')
    },
    [router]
  )

  const logout = useCallback(async () => {
    if (logoutPending) return

    setLogoutPending(true)
    clearAuthStorage()
    setUser(null)
    router.replace('/login')

    fetch('/api/auth/logout', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      credentials: 'include',
    }).finally(() => {
      setLogoutPending(false)
    })
  }, [logoutPending, router])

  const getAuthHeaders = useCallback((): HeadersInit => ({}), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      logoutPending,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      getAuthHeaders,
    }),
    [user, loading, logoutPending, login, register, logout, getAuthHeaders]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
