const DEFAULT_API_BASE_URL = 'http://localhost:3000'

export interface ApiEnvelope<TData = unknown> {
  code?: number
  message?: string
  data?: TData
}

export interface ApiRequestOptions {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
  token?: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ApiUploadOptions {
  path: string
  filePath: string
  name?: string
  formData?: Record<string, unknown>
  token?: string
  timeout?: number
  headers?: Record<string, string>
}

export class BackendApiError extends Error {
  code: number
  statusCode: number
  data: unknown

  constructor(message: string, code = 50000, statusCode = 0, data: unknown = null) {
    super(message)
    this.name = 'BackendApiError'
    this.code = code
    this.statusCode = statusCode
    this.data = data
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function resolveEnvApiBaseUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env
    return trimTrailingSlash(String(env?.VITE_API_BASE_URL || '').trim())
  } catch {
    return ''
  }
}

export function resolveApiBaseUrl(): string {
  const fromEnv = resolveEnvApiBaseUrl()
  return fromEnv || DEFAULT_API_BASE_URL
}

function buildUrl(path: string): string {
  const cleanPath = String(path || '').trim()
  if (!cleanPath) return resolveApiBaseUrl()
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
  return `${resolveApiBaseUrl()}${normalizedPath}`
}

function normalizePayload(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  const text = raw.trim()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return raw
  }
}

function normalizeEnvelope<TData>(raw: unknown): ApiEnvelope<TData> {
  const payload = normalizePayload(raw)
  if (!payload || typeof payload !== 'object') {
    return {
      code: 50000,
      message: '接口返回格式错误',
      data: payload as TData,
    }
  }
  return payload as ApiEnvelope<TData>
}

function buildHeaders(
  token?: string,
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    ...(extraHeaders || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiRequest<TData = unknown>(
  options: ApiRequestOptions,
): Promise<TData> {
  const {
    path,
    method = 'GET',
    data,
    token,
    timeout = 20000,
    headers,
  } = options

  const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url: buildUrl(path),
      method: method as never,
      data: data as never,
      timeout,
      header: {
        'Content-Type': 'application/json',
        ...buildHeaders(token, headers),
      },
      success: (result) => resolve(result),
      fail: (error) => reject(error),
    })
  }).catch((error) => {
    const message = String((error as { errMsg?: unknown })?.errMsg || '').trim()
    throw new BackendApiError(message || '网络请求失败')
  })

  const statusCode = Math.max(0, Number(response.statusCode || 0))
  const envelope = normalizeEnvelope<TData>(response.data)

  if (statusCode < 200 || statusCode >= 300) {
    throw new BackendApiError(
      String(envelope.message || `请求失败(${statusCode})`),
      Number(envelope.code || 50000),
      statusCode,
      envelope.data,
    )
  }

  if (Number(envelope.code) !== 0) {
    throw new BackendApiError(
      String(envelope.message || '请求失败'),
      Number(envelope.code || 50000),
      statusCode,
      envelope.data,
    )
  }

  return (envelope.data ?? ({} as TData)) as TData
}

export async function apiUpload<TData = unknown>(
  options: ApiUploadOptions,
): Promise<TData> {
  const {
    path,
    filePath,
    name = 'file',
    formData,
    token,
    timeout = 30000,
    headers,
  } = options

  const response = await new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl(path),
      filePath,
      name,
      formData,
      timeout,
      header: buildHeaders(token, headers),
      success: (result) => resolve(result),
      fail: (error) => reject(error),
    })
  }).catch((error) => {
    const message = String((error as { errMsg?: unknown })?.errMsg || '').trim()
    throw new BackendApiError(message || '文件上传失败')
  })

  const statusCode = Math.max(0, Number(response.statusCode || 0))
  const envelope = normalizeEnvelope<TData>(response.data)

  if (statusCode < 200 || statusCode >= 300) {
    throw new BackendApiError(
      String(envelope.message || `上传失败(${statusCode})`),
      Number(envelope.code || 50000),
      statusCode,
      envelope.data,
    )
  }

  if (Number(envelope.code) !== 0) {
    throw new BackendApiError(
      String(envelope.message || '上传失败'),
      Number(envelope.code || 50000),
      statusCode,
      envelope.data,
    )
  }

  return (envelope.data ?? ({} as TData)) as TData
}
