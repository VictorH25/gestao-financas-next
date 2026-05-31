import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const TOKEN_COOKIE = 'finfamilia_token'
const JWT_ISSUER = 'finfamilia'
const JWT_AUDIENCE = 'finfamilia-app'

export type AuthUser = {
  id: string
  email: string
  name: string
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET nao configurado')
  }
  return secret
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    {
      expiresIn: '7d',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: user.id,
      algorithm: 'HS256',
    }
  )
}

export function verifyAuthToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  }) as jwt.JwtPayload

  if (!payload.userId || !payload.email || !payload.name) {
    throw new Error('Token invalido')
  }

  return {
    id: String(payload.userId),
    email: String(payload.email),
    name: String(payload.name),
  }
}

export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  const authorization = req.headers.get('authorization')
  let token: string | null = null

  if (authorization?.startsWith('Bearer ')) {
    token = authorization.slice('Bearer '.length)
  } else {
    token = (await cookies()).get(TOKEN_COOKIE)?.value ?? null
  }

  if (!token) return null

  try {
    return verifyAuthToken(token)
  } catch {
    return null
  }
}
