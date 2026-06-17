import { removeStorageKey, safeReadLocalStorage, safeWriteLocalStorage, STORAGE_KEYS } from '@/lib/storage'
import type { AuthSession } from '@/types/auth'

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api'

export interface StoredAuthState {
  accessToken: string
  refreshToken: string
  session: AuthSession
}

interface RefreshResponse {
  accessToken: string
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean
  body?: unknown
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function apiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

function authHeaders(headers: Headers, auth: boolean) {
  if (!auth) {
    return
  }

  const storedAuth = readStoredAuth()
  if (storedAuth?.accessToken) {
    headers.set('Authorization', `Bearer ${storedAuth.accessToken}`)
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<unknown>
  }

  const text = await response.text()
  return text || null
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === 'string').join(', ')
    }
  }

  return fallback
}

export function readStoredAuth() {
  return safeReadLocalStorage<StoredAuthState | null>(STORAGE_KEYS.auth, null)
}

export function writeStoredAuth(auth: StoredAuthState) {
  safeWriteLocalStorage(STORAGE_KEYS.auth, auth)
}

export function clearStoredAuth() {
  removeStorageKey(STORAGE_KEYS.auth)
}

async function refreshAccessToken() {
  const storedAuth = readStoredAuth()
  if (!storedAuth?.refreshToken) {
    return null
  }

  const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: storedAuth.refreshToken,
      userId: storedAuth.session.userId,
    }),
  })

  if (!response.ok) {
    clearStoredAuth()
    return null
  }

  const payload = (await parseResponse(response)) as RefreshResponse
  const nextAuth = {
    ...storedAuth,
    accessToken: payload.accessToken,
  }
  writeStoredAuth(nextAuth)
  return nextAuth.accessToken
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}, retryOnUnauthorized = true) {
  const { auth = true, body, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers)
  const hasJsonBody = body !== undefined && !(body instanceof FormData)

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  authHeaders(headers, auth)

  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
  }

  if (body !== undefined) {
    requestInit.body = hasJsonBody ? JSON.stringify(body) : (body as BodyInit)
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, requestInit)

  if (response.status === 401 && retryOnUnauthorized && auth) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      return apiRequest<T>(path, options, false)
    }
  }

  const payload = await parseResponse(response)
  if (!response.ok) {
    throw new ApiError(errorMessage(payload, `Request failed with status ${response.status}`), response.status, payload)
  }

  return payload as T
}

export function getApiErrorMessage(error: unknown, fallback = 'Không thể kết nối đến máy chủ.') {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
