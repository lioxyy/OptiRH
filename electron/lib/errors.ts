export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  NO_ACTIVE_CONTRACT: 'NO_ACTIVE_CONTRACT',
  LEAVE_NOT_FOUND: 'LEAVE_NOT_FOUND',
  LEAVE_OVERLAP: 'LEAVE_OVERLAP',
  LEAVE_OVER_ALLOCATION: 'LEAVE_OVER_ALLOCATION',
  LEAVE_INVALID_STATUS: 'LEAVE_INVALID_STATUS',
  CANDIDATE_NOT_FOUND: 'CANDIDATE_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  EVALUATION_NOT_FOUND: 'EVALUATION_NOT_FOUND',
  PAYROLL_ALREADY_GENERATED: 'PAYROLL_ALREADY_GENERATED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  DEPARTMENT_ALREADY_EXISTS: 'DEPARTMENT_ALREADY_EXISTS',
  DEPARTMENT_NOT_EMPTY: 'DEPARTMENT_NOT_EMPTY',
  DEPARTMENT_HAS_AGENT: 'DEPARTMENT_HAS_AGENT',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  ABSENCE_NOT_FOUND: 'ABSENCE_NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  ALREADY_CLOCKED_IN: 'ALREADY_CLOCKED_IN',
  NOT_CLOCKED_IN: 'NOT_CLOCKED_IN',
  ALREADY_CLOCKED_OUT: 'ALREADY_CLOCKED_OUT',
  INVALID_DATES: 'INVALID_DATES',
  LEAVE_TYPE_NOT_FOUND: 'LEAVE_TYPE_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MASSROUF_NOT_FOUND: 'MASSROUF_NOT_FOUND',
  INVALID_MONTH_YEAR: 'INVALID_MONTH_YEAR',
  PAYROLL_NOT_FOUND: 'PAYROLL_NOT_FOUND',
  ABSENCE_ALREADY_LOGGED: 'ABSENCE_ALREADY_LOGGED',
  SELF_APPROVAL_NOT_ALLOWED: 'SELF_APPROVAL_NOT_ALLOWED',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(code)
    this.name = 'AppError'
  }
}

import type { Request, Response, NextFunction } from 'express'
import { fail } from './response'

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.code, err.code, err.details))
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code: string; meta?: unknown }
    if (prismaErr.code === 'P2002') {
      return res.status(409).json(fail('CONFLICT', 'Unique constraint violation', prismaErr.meta))
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Record not found'))
    }
  }

  console.error('[Unhandled Error]', err)
  return res.status(500).json(fail('INTERNAL_ERROR', 'An unexpected error occurred'))
}
