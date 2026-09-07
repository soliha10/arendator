import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { Role } from '@prisma/client'

/**
 * JWT bilan ishlash. Bu modul `next/headers` ga bogʻliq emas —
 * shu sabab uni Edge middleware ham import qila oladi.
 */

export const SESSION_COOKIE_NAME = 'arendator_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 kun

export interface SessionPayload extends JWTPayload {
  sub: string
  role: Role
  /** token versiyasi — parol oʻzgarganda barcha sessiyalarni bekor qiladi */
  tv: number
  name: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET kamida 32 ta belgidan iborat boʻlishi kerak. `openssl rand -base64 32` bilan yarating.',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: {
  sub: string
  role: Role
  tv: number
  name: string
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('arendator')
    .setAudience('arendator-web')
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret(), {
      issuer: 'arendator',
      audience: 'arendator-web',
    })
    if (!payload.sub) return null
    return payload
  } catch {
    return null
  }
}
