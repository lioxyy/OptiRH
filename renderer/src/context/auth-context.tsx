import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '../lib/api'

interface User {
  id_emp: number
  name: string
  email: string
  role: 'Admin' | 'Agent' | 'Employee'
  id_depts: number[]
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('optirh_access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api.get('/api/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('optirh_access_token')
        localStorage.removeItem('optirh_refresh_token')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { access_token, refresh_token, user: userData } = res.data.data
    localStorage.setItem('optirh_access_token', access_token)
    localStorage.setItem('optirh_refresh_token', refresh_token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('optirh_access_token')
    localStorage.removeItem('optirh_refresh_token')
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
