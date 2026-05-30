import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { MonthRecord } from '@/types'

// Garante ou cria o registro do mês no banco
async function getOrCreateMonth(month: string) {
  let record = await prisma.monthRecord.findUnique({
    where: { month },
    include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
  })
  if (!record) {
    record = await prisma.monthRecord.create({
      data: { month },
      include: { demaisGastos: true },
    })
  }
  return record
}

// GET /api/financas?month=2026-05
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    if (!month) {
      return NextResponse.json({ error: 'month é obrigatório' }, { status: 400 })
    }

    const record = await getOrCreateMonth(month)
    return NextResponse.json(record)
  } catch (e) {
    console.error('[GET /api/financas]', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PATCH /api/financas  → atualiza campos de receitas e despesas fixas do mês
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, ...fields } = body
    if (!month) {
      return NextResponse.json({ error: 'month é obrigatório' }, { status: 400 })
    }

    // Garante que o registro existe antes de atualizar
    await getOrCreateMonth(month)

    const allowed = [
      'meuSalario',
      'salarioEsposa',
      'agua',
      'luz',
      'parcelaCasa',
      'internet',
      'seguroMoto',
      'feira'
    ]
    const data: Record<string, number> = {}
    
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        data[key] = parseFloat(fields[key]) || 0
      }
    }

    const updated = await prisma.monthRecord.update({
      where: { month },
      data,
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('[PATCH /api/financas]', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/financas  → adiciona um novo item de "Demais Gastos"
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, nome, valor } = body
    if (!month || !nome || valor === undefined) {
      return NextResponse.json({ error: 'month, nome e valor são obrigatórios' }, { status: 400 })
    }

    const record = await getOrCreateMonth(month)

    const existing = await prisma.dynamicExpense.findFirst({
      where: {
        monthRecordId: record.id,
        nome: nome.trim(),
      },
    })

    if (existing) {
      await prisma.dynamicExpense.update({
        where: { id: existing.id },
        data: { valor: parseFloat(valor) || 0 },
      })
    } else {
      await prisma.dynamicExpense.create({
        data: {
          nome: nome.trim(),
          valor: parseFloat(valor) || 0,
          monthRecordId: record.id,
        },
      })
    }

    // Retorna o registro completo e atualizado
    const updated = await prisma.monthRecord.findUnique({
      where: { month },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json(updated, { status: 201 })
  } catch (e) {
    console.error('[POST /api/financas]', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/financas?id=xxx&month=2026-05  → exclui um item de "Demais Gastos"
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const month = searchParams.get('month')
    if (!id || !month) {
      return NextResponse.json({ error: 'id e month são obrigatórios' }, { status: 400 })
    }

    await prisma.dynamicExpense.delete({ where: { id } })

    const updated = await prisma.monthRecord.findUnique({
      where: { month },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('[DELETE /api/financas]', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
