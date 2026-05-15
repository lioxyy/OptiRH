export interface ApiSuccess<T> {
  ok: true
  data: T
  message?: string
}

export interface ApiError {
  ok: false
  code: string
  message: string
  details?: unknown
}

export function success<T>(data: T, message?: string): ApiSuccess<T> {
  return { ok: true, data, ...(message && { message }) }
}

export function fail(code: string, message: string, details?: unknown): ApiError {
  return { ok: false, code, message, details }
}
