export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
const SESSION_INVALIDATED_EVENT = 'pos:session-invalidated'
let isInvalidatingSession = false

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

type DownloadResult = {
  blob: Blob
  filename?: string
  contentType: string
}

function parseFilename(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) {
    return undefined
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1]
}

function invalidateSessionAndRedirect() {
  if (typeof window === 'undefined' || isInvalidatingSession) {
    return
  }

  isInvalidatingSession = true

  window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT))

  void fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  }).catch(() => undefined)

  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const hasJsonBody = init.body !== undefined && init.body !== null

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload: JsonValue =
    contentType.includes('application/json')
      ? await response.json()
      : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as Record<string, unknown>).message ?? 'Request failed')
        : response.statusText || 'Request failed'

    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/logout')) {
      invalidateSessionAndRedirect()
    }

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export async function apiRequestWithoutSessionInvalidation<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const hasJsonBody = init.body !== undefined && init.body !== null

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload: JsonValue =
    contentType.includes('application/json')
      ? await response.json()
      : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as Record<string, unknown>).message ?? 'Request failed')
        : response.statusText || 'Request failed'

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export async function apiDownload(path: string, init: RequestInit = {}): Promise<DownloadResult> {
  const headers = new Headers(init.headers)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    const payload: JsonValue =
      contentType.includes('application/json')
        ? await response.json()
        : await response.text()

    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as Record<string, unknown>).message ?? 'Request failed')
        : response.statusText || 'Request failed'

    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/logout')) {
      invalidateSessionAndRedirect()
    }

    throw new ApiError(message, response.status, payload)
  }

  return {
    blob: await response.blob(),
    filename: parseFilename(response.headers.get('content-disposition')),
    contentType,
  }
}
