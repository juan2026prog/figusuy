const DEV_SITE_URL = 'http://localhost:5173'
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim()
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''

export const siteUrl = runtimeOrigin || configuredSiteUrl || DEV_SITE_URL

export const authCallbackUrl = `${siteUrl}/auth/callback`

export const buildSiteUrl = (path = '/') => new URL(path, `${siteUrl}/`).toString()
