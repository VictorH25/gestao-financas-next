import express from 'express'
import { prisma } from './prisma.js'
import { requireAuth } from './auth.js'

const router = express.Router()
router.use(requireAuth)

async function getOrCreateMonth(userId, month) {
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

router.get('/', async (req, res) => {
  try {
    const month = req.query.month
    if (!month) {
      return res.status(400).json({ error: 'month e obrigatorio' })
    }

    const record = await getOrCreateMonth(req.user.id, String(month))
    return res.json(record)
  } catch (e) {
    console.error('[GET /api/financas]', e)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

router.patch('/', async (req, res) => {
  try {
    const { month, ...fields } = req.body
    if (!month) {
      return res.status(400).json({ error: 'month e obrigatorio' })
    }

    await getOrCreateMonth(req.user.id, month)

    const allowed = ['meuSalario', 'salarioEsposa', 'agua', 'luz', 'parcelaCasa', 'internet', 'seguroMoto', 'feira']
    const data = {}

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        data[key] = Number.parseFloat(fields[key]) || 0
      }
    }

    const updated = await prisma.monthRecord.update({
      where: { userId_month: { userId: req.user.id, month } },
      data,
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return res.json(updated)
  } catch (e) {
    console.error('[PATCH /api/financas]', e)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

router.post('/', async (req, res) => {
  try {
    const month = String(req.body.month ?? '')
    const nome = String(req.body.nome ?? '').trim()
    const valor = req.body.valor

    if (!month || !nome || valor === undefined) {
      return res.status(400).json({ error: 'month, nome e valor sao obrigatorios' })
    }

    const record = await getOrCreateMonth(req.user.id, month)
    const existing = await prisma.dynamicExpense.findFirst({
      where: {
        monthRecordId: record.id,
        nome,
      },
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
      where: { userId_month: { userId: req.user.id, month } },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return res.status(201).json(updated)
  } catch (e) {
    console.error('[POST /api/financas]', e)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

router.delete('/', async (req, res) => {
  try {
    const id = req.query.id
    const month = req.query.month
    if (!id || !month) {
      return res.status(400).json({ error: 'id e month sao obrigatorios' })
    }

    const expense = await prisma.dynamicExpense.findFirst({
      where: {
        id: String(id),
        monthRecord: {
          userId: req.user.id,
          month: String(month),
        },
      },
    })

    if (!expense) {
      return res.status(404).json({ error: 'Gasto nao encontrado' })
    }

    await prisma.dynamicExpense.delete({ where: { id: String(id) } })

    const updated = await prisma.monthRecord.findUnique({
      where: { userId_month: { userId: req.user.id, month: String(month) } },
      include: { demaisGastos: { orderBy: { createdAt: 'asc' } } },
    })

    return res.json(updated)
  } catch (e) {
    console.error('[DELETE /api/financas]', e)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
