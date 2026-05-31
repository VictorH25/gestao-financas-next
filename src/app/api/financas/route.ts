import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOrCreateMonth(userId: string, month: string) {
  let record = await prisma.monthRecord.findUnique({
    where: { userId_month: { userId, month } },
    include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
  })

  if (!record) {
    record = await prisma.monthRecord.create({
      data: { month, userId },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })
  }

  return record
}

async function requireAuth(req: Request) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return null
  return user
}

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    if (!month) {
      return NextResponse.json({ error: 'month e obrigatorio' }, { status: 400 })
    }
    const record = await getOrCreateMonth(user.id, month)
    return NextResponse.json(record)
  } catch (e) {
    console.error('[GET /api/financas]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { month, ...fields } = body
    if (!month) {
      return NextResponse.json({ error: 'month e obrigatorio' }, { status: 400 })
    }

    await getOrCreateMonth(user.id, String(month))

    const allowed = ['meuSalario', 'salarioEsposa', 'agua', 'luz', 'parcelaCasa', 'internet', 'seguroMoto', 'feira']
    const data: Record<string, number> = {}

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        data[key] = Number.parseFloat(fields[key]) || 0
      }
    }

    const updated = await prisma.monthRecord.update({
      where: { userId_month: { userId: user.id, month: String(month) } },
      data,
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('[PATCH /api/financas]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const month = String(body.month ?? '')
    const nome = String(body.nome ?? '').trim()
    const valor = body.valor

    if (!month || !nome || valor === undefined) {
      return NextResponse.json({ error: 'month, nome e valor sao obrigatorios' }, { status: 400 })
    }

    const record = await getOrCreateMonth(user.id, month)
    const existing = await prisma.dynamicExpense.findFirst({
      where: { monthRecordId: record.id, nome },
    })

    if (existing) {
      await prisma.dynamicExpense.update({
        where: { id: existing.id },
        data: { valor: Number.parseFloat(valor) || 0 },
      })
    } else {
      await prisma.dynamicExpense.create({
        data: {
          nome,
          valor: Number.parseFloat(valor) || 0,
          monthRecordId: record.id,
        },
      })
    }

    const updated = await prisma.monthRecord.findUnique({
      where: { userId_month: { userId: user.id, month } },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (e) {
    console.error('[POST /api/financas]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const month = searchParams.get('month')

    if (!id || !month) {
      return NextResponse.json({ error: 'id e month sao obrigatorios' }, { status: 400 })
    }

    const expense = await prisma.dynamicExpense.findFirst({
      where: {
        id,
        monthRecord: {
          userId: user.id,
          month,
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Gasto nao encontrado' }, { status: 404 })
    }

    await prisma.dynamicExpense.delete({ where: { id } })

    const updated = await prisma.monthRecord.findUnique({
      where: { userId_month: { userId: user.id, month } },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('[DELETE /api/financas]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Banco de dados indisponivel. Verifique DATABASE_URL e se o Postgres esta ativo.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
