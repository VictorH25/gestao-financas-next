import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAuthToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const rememberMe = body.rememberMe !== false

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha sao obrigatorios' }, { status: 400 })
    }

    const userWithPassword = await prisma.user.findUnique({ where: { email } })
    if (!userWithPassword) {
      return NextResponse.json({ error: 'Email ou senha invalidos' }, { status: 401 })
    }

    const passwordMatches = await bcrypt.compare(password, userWithPassword.password)
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Email ou senha invalidos' }, { status: 401 })
    }

    const user = { id: userWithPassword.id, name: userWithPassword.name, email: userWithPassword.email }
    const token = signAuthToken(user)

    const response = NextResponse.json({ user })
    response.cookies.set('finfamilia_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}),
    })
    return response
  } catch (e) {
    console.error('[POST /api/auth/login]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Nao foi possivel entrar agora. Tente novamente.' }, { status: 500 })
  }
}
