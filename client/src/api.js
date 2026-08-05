import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moodpath_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      const isAuthEndpoint =
        err.config.url.includes('/auth/login') ||
        err.config.url.includes('/auth/register') ||
        err.config.url.includes('/auth/mfa/')
      if (!isAuthEndpoint) {
        localStorage.removeItem('moodpath_token')
        localStorage.removeItem('moodpath_user')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
