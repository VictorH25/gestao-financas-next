import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import authRoutes from './routes-auth.js'
import financasRoutes from './routes-financas.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const frontendUrls = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (frontendUrls.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin nao permitida: ${origin}`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/financas', financasRoutes)

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`)
})
