// Shared TypeScript types used by both electron and renderer.
// These are plain TypeScript interfaces — NOT Zod schemas, NOT Prisma types.
// Zod schemas live in feature.schema.ts files.
// Prisma-generated types live in @prisma/client.

export type Role = 'Admin' | 'Agent' | 'Employee'

export interface AuthUser {
    id_emp: number
    name: string
    role: Role
    id_dept: number
}

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

export type ApiResponse<T> = ApiSuccess<T> | ApiError
