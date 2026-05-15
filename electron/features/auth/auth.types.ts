import { z } from 'zod'
import { LoginSchema, RefreshSchema } from './auth.schema'

export type LoginDTO = z.infer<typeof LoginSchema>
export type RefreshDTO = z.infer<typeof RefreshSchema>

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: {
    id_emp: number
    name: string
    email: string
    role: 'Admin' | 'Agent' | 'Employee'
    id_dept: number
  }
}
