import express from 'express'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { clearAuthCookie, requireAuth, setAuthCookie, signAuthToken } from './auth.js'
import { prisma } from './prisma.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim()
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const password = String(req.body.password ?? '')
    const rememberMe = req.body.rememberMe !== false

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Este email ja esta cadastrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    })

    const token = signAuthToken(user)
    setAuthCookie(res, token, rememberMe)
    return res.status(201).json({ user })
  } catch (e) {
    console.error('[POST /api/auth/register]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return res.status(503).json({ error: 'Servico temporariamente indisponivel. Tente novamente em instantes.' })
    }
    return res.status(500).json({ error: 'Nao foi possivel cadastrar agora. Tente novamente.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const password = String(req.body.password ?? '')
    const rememberMe = req.body.rememberMe !== false

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios' })
    }

    const userWithPassword = await prisma.user.findUnique({ where: { email } })
    if (!userWithPassword) {
      return res.status(401).json({ error: 'Email ou senha invalidos' })
    }

    const passwordMatches = await bcrypt.compare(password, userWithPassword.password)
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email ou senha invalidos' })
    }

    const user = { id: userWithPassword.id, name: userWithPassword.name, email: userWithPassword.email }
    const token = signAuthToken(user)
    setAuthCookie(res, token, rememberMe)
    return res.json({ user })
  } catch (e) {
    console.error('[POST /api/auth/login]', e)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return res.status(503).json({ error: 'Servico temporariamente indisponivel. Tente novamente em instantes.' })
    }
    return res.status(500).json({ error: 'Nao foi possivel entrar agora. Tente novamente.' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user })
})

router.post('/logout', async (_req, res) => {
  clearAuthCookie(res)
  return res.json({ ok: true })
})

export default router
