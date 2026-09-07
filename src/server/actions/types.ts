/** Barcha Server Action'lar uchun yagona natija shakli */
export type FieldErrors = Record<string, string[]>

export interface ActionState<T = undefined> {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: FieldErrors
  data?: T
}

export const idleState: ActionState = { status: 'idle' }

export function errorState(
  message: string,
  fieldErrors?: FieldErrors,
): ActionState<never> {
  return { status: 'error', message, fieldErrors }
}

export function successState<T>(message?: string, data?: T): ActionState<T> {
  return { status: 'success', message, data }
}

/** Zod xatolarini ActionState formatiga o'giradi */
export function fromZodError(error: {
  issues: { path: PropertyKey[]; message: string }[]
}): ActionState<never> {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_root'
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  const first = error.issues[0]?.message ?? 'Maʼlumotlarda xatolik bor'
  return { status: 'error', message: first, fieldErrors }
}
