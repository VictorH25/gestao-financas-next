import jwt from 'jsonwebtoken'

const TOKEN_COOKIE = 'finfamilia_token'
const JWT_ISSUER = 'finfamilia'
const JWT_AUDIENCE = 'finfamilia-app'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET nao configurado')
  }
  return secret
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
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

export function verifyAuthToken(token) {
  const payload = jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  })

  if (!payload.userId || !payload.email || !payload.name) {
    throw new Error('Token invalido')
  }

  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
  }
}

export function setAuthCookie(res, token, rememberMe = true) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 * 1000 } : {}),
  })
}

export function clearAuthCookie(res) {
  res.cookie(TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export function getTokenFromRequest(req) {
  const authorization = req.headers.authorization
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length)
  }

  return req.cookies[TOKEN_COOKIE] ?? null
}

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ error: 'Nao autenticado' })
  }

  try {
    req.user = verifyAuthToken(token)
    return next()
  } catch {
    return res.status(401).json({ error: 'Sessao expirada ou invalida' })
  }
}
