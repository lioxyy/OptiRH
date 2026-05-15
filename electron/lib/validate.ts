import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from './errors'

type ValidationTarget = 'body' | 'params' | 'query'

export function validate(target: ValidationTarget, schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      return next(new AppError('VALIDATION_ERROR', 400, formatZodError(result.error)))
    }
    ;(req as any)[target] = result.data
    next()
  }
}

function formatZodError(error: ZodError) {
  return error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }))
}
