import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAuthToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const rememberMe = body.rememberMe !== false

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha sao obrigatorios' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Este email ja esta cadastrado' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    })

    const token = signAuthToken(user)
    const response = NextResponse.json({ user }, { status: 201 })
    response.cookies.set('finfamilia_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}),
    })
    return response
  } catch (e) {
    console.error('[POST /api/auth/register]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Nao foi possivel cadastrar agora. Tente novamente.' }, { status: 500 })
  }
}
