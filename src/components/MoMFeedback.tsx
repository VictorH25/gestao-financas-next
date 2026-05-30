'use client'

import React from 'react'
import { formatBRL } from '@/lib/utils'
import { MonthRecord, FixedCategory } from '@/types'

const THRESHOLD_DANGER = 0.10   // +10% → negativo
const THRESHOLD_GOOD = -0.05    // -5%  → positivo

interface DeltaBadgeProps {
  label: 'receitas' | 'despesas'
  cur: number
  prev: number
}

function DeltaBadge({ label, cur, prev }: DeltaBadgeProps) {
  if (prev == null || prev === 0) return null
  const pct = ((cur - prev) / prev) * 100
  if (Math.abs(pct) < 0.5) return null // Ignorar variações insignificantes (<0.5%)

  // Receitas aumentando = positivo. Despesas aumentando = negativo.
  const isPositive = label === 'receitas' ? pct > 0 : pct < 0
  const isNegative = label === 'receitas' ? pct < 0 : pct > 0

  const colorClass = isPositive 
    ? 'bg-emerald-400/15 text-emerald-400 border-emerald-500/20'
    : isNegative 
      ? 'bg-rose-400/15 text-rose-400 border-rose-500/20'
      : 'bg-white/5 text-white/40 border-white/5'

  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→'

  return (
    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border leading-none flex items-center gap-0.5 ${colorClass}`}>
      {arrow} {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

interface MoMFeedbackProps {
  current: MonthRecord | undefined
  previous: MonthRecord | undefined
  fixedCategories: FixedCategory[]
}

export default function MoMFeedback({ current, previous, fixedCategories }: MoMFeedbackProps) {
  if (!current || !previous) return null

  const curTotal = (current.meuSalario || 0) + (current.salarioEsposa || 0)
  const prevTotal = (previous.meuSalario || 0) + (previous.salarioEsposa || 0)

  // Obter soma das despesas (fixas tradicionais + fixas dinâmicas + eventuais)
  const getDespesas = (record: MonthRecord) => {
    const fixedSum = fixedCategories.reduce((acc, cat) => {
      if (cat.isDefault) {
        return acc + (record[cat.id as keyof MonthRecord] as number || 0)
      } else {
        const gasto = (record.demaisGastos || []).find(g => g.nome === `[FIXA] ${cat.label}`)
        return acc + (gasto?.valor || 0)
      }
    }, 0)

    const otherSum = (record.demaisGastos || [])
      .filter(g => !g.nome.startsWith('[FIXA] '))
      .reduce((a, g) => a + g.valor, 0)

    return fixedSum + otherSum
  }

  const curDespesas = getDespesas(current)
  const prevDespesas = getDespesas(previous)

  const positives: string[] = []
  const negatives: string[] = []

  // Saldo comparado
  const curSaldo = curTotal - curDespesas
  const prevSaldo = prevTotal - prevDespesas
  if (prevSaldo !== 0) {
    const saldoChange = ((curSaldo - prevSaldo) / Math.abs(prevSaldo)) * 100
    if (saldoChange >= 5)  positives.push(`Saldo cresceu ${saldoChange.toFixed(0)}% em relação ao mês anterior`)
    if (saldoChange <= -5) negatives.push(`Saldo caiu ${Math.abs(saldoChange).toFixed(0)}% em relação ao mês anterior`)
  }

  // Despesas fixas individuais comparadas dinamicamente
  for (const cat of fixedCategories) {
    let prevVal = 0
    let curVal = 0
    if (cat.isDefault) {
      prevVal = (previous[cat.id as keyof MonthRecord] as number) || 0
      curVal = (current[cat.id as keyof MonthRecord] as number) || 0
    } else {
      const prevG = (previous.demaisGastos || []).find(g => g.nome === `[FIXA] ${cat.label}`)
      const curG = (current.demaisGastos || []).find(g => g.nome === `[FIXA] ${cat.label}`)
      prevVal = prevG?.valor || 0
      curVal = curG?.valor || 0
    }

    if (prevVal === 0) continue
    const pct = ((curVal - prevVal) / prevVal) * 100
    if (pct >= THRESHOLD_DANGER * 100) {
      negatives.push(`${cat.icon} ${cat.label} aumentou ${pct.toFixed(0)}% (${formatBRL(prevVal)} → ${formatBRL(curVal)})`)
    } else if (pct <= THRESHOLD_GOOD * 100) {
      positives.push(`${cat.icon} ${cat.label} reduziu ${Math.abs(pct).toFixed(0)}% (${formatBRL(prevVal)} → ${formatBRL(curVal)})`)
    }
  }

  // Demais gastos eventuais comparados
  const dynCur = (current.demaisGastos || []).filter(g => !g.nome.startsWith('[FIXA] ')).reduce((a, g) => a + g.valor, 0)
  const dynPrev = (previous.demaisGastos || []).filter(g => !g.nome.startsWith('[FIXA] ')).reduce((a, g) => a + g.valor, 0)
  if (dynPrev > 0) {
    const pct = ((dynCur - dynPrev) / dynPrev) * 100
    if (pct >= THRESHOLD_DANGER * 100) negatives.push(`Gastos eventuais subiram ${pct.toFixed(0)}% (${formatBRL(dynPrev)} → ${formatBRL(dynCur)})`)
    if (pct <= THRESHOLD_GOOD * 100)   positives.push(`Gastos eventuais caíram ${Math.abs(pct).toFixed(0)}% — ótimo controle!`)
  }

  if (positives.length === 0 && negatives.length === 0) return null

  return (
    <div className="card glass-card fade-in delay-3" id="mom-feedback-section">
      <div className="card-header">
        <div className="card-icon advisor-icon">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Análise vs. Mês Anterior</h2>
          <p className="text-xs text-white/30">Comparação automática com o mês anterior</p>
        </div>
      </div>

      <div className="card-body grid sm:grid-cols-2 gap-6">
        {/* Saldo comparison */}
        <div className="col-span-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/40 uppercase tracking-wider">Receitas este mês</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 leading-none">{formatBRL(curTotal)}</span>
              <DeltaBadge label="receitas" cur={curTotal} prev={prevTotal} />
            </div>
          </div>
          <div className="flex flex-col gap-1 sm:items-end text-left sm:text-right">
            <span className="text-xs text-white/40 uppercase tracking-wider">Despesas este mês</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-rose-400 leading-none">{formatBRL(curDespesas)}</span>
              <DeltaBadge label="despesas" cur={curDespesas} prev={prevDespesas} />
            </div>
          </div>
        </div>

        {positives.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              Pontos Positivos
            </h3>
            <ul className="space-y-2">
              {positives.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70 bg-emerald-400/[0.08] border border-emerald-500/15 rounded-xl px-3 py-2">
                  <span className="mt-0.5 text-emerald-400 flex-shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {negatives.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} />
              </svg>
              Pontos de Atenção
            </h3>
            <ul className="space-y-2">
              {negatives.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70 bg-rose-400/[0.08] border border-rose-500/15 rounded-xl px-3 py-2">
                  <span className="mt-0.5 text-rose-400 flex-shrink-0">!</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
