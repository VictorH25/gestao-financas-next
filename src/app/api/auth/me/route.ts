import { NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getAuthUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }
  return NextResponse.json({ user })
}
