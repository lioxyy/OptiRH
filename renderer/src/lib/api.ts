import axios from 'axios'

function getBackendPort(): string {
  if (typeof window !== 'undefined') {
    if ((window as any).electronAPI?.backendPort) {
      return (window as any).electronAPI.backendPort
    }
    const params = new URLSearchParams(window.location.search)
    const queryPort = params.get('port')
    if (queryPort) {
      localStorage.setItem('optirh_backend_port', queryPort)
      return queryPort
    }
    const storedPort = localStorage.getItem('optirh_backend_port')
    if (storedPort) return storedPort
  }
  return '3001'
}

export const api = axios.create()

api.interceptors.request.use((config) => {
  const port = getBackendPort()
  config.baseURL = `http://localhost:${port}`

  const token = localStorage.getItem('optirh_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('optirh_access_token')
      localStorage.removeItem('optirh_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
