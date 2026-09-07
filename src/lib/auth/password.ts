import bcrypt from 'bcryptjs'

const ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS)
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/**
 * Timing attack'dan himoya: foydalanuvchi topilmaganda ham
 * hash tekshiruvi qancha vaqt olsa, shuncha vaqt sarflaymiz.
 */
const DUMMY_HASH = '$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQR'

export async function fakeVerify(): Promise<void> {
  await bcrypt.compare('dummy-password', DUMMY_HASH).catch(() => false)
}
