import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as PlansApi from '@/lib/api/plans'
import * as AuthApi from '@/lib/api/auth'
import { setBaseUrl, setAuthToken } from '@/lib/api/client'

// Configure API base URL from env if provided
if (import.meta.env.VITE_API_BASE_URL) {
  console.log('🔧 Using API base URL from environment:', import.meta.env.VITE_API_BASE_URL)
  setBaseUrl(import.meta.env.VITE_API_BASE_URL as string)
} else {
  // Default to staging API URL
  console.log('🔧 Using default staging API base URL: https://car-api.stg.aurainsuretech.com')
  setBaseUrl('https://car-api.stg.aurainsuretech.com')
}
// Initialize token from localStorage if present
try {
  const token = localStorage.getItem('authToken')
  if (token) setAuthToken(token)
} catch {}
// Expose helpers for quick console testing in dev
if (import.meta.env.DEV) {
  // @ts-expect-error: attach to window for debugging
  window.__api = { PlansApi, AuthApi, setBaseUrl, setAuthToken }
}

createRoot(document.getElementById("root")!).render(<App />);
