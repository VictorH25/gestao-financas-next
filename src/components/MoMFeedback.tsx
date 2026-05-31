'use client'

import React from 'react'
import { FixedCategory, MonthRecord } from '@/types'
import { formatBRL, nomeMes } from '@/lib/utils'

interface MoMFeedbackProps {
  current: MonthRecord | undefined
  previous: MonthRecord | undefined
  fixedCategories: FixedCategory[]
}

interface MetricRow {
  id: string
  label: string
  currentValue: number
  previousValue: number
  goodWhenIncrease: boolean
  icon?: string
}

function calcPct(currentValue: number, previousValue: number): number | null {
  if (!Number.isFinite(previousValue) || previousValue === 0) return null
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
}

function calcDelta(currentValue: number, previousValue: number): number {
  return currentValue - previousValue
}

function getTone(goodWhenIncrease: boolean, delta: number) {
  if (delta === 0) return 'neutral'
  const positive = goodWhenIncrease ? delta > 0 : delta < 0
  return positive ? 'good' : 'bad'
}

function ToneBadge({ tone, pct }: { tone: 'good' | 'bad' | 'neutral'; pct: number | null }) {
  if (pct === null) {
    return <span className="text-[11px] font-bold text-white/40">sem base</span>
  }

  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→'
  const cls =
    tone === 'good'
      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
      : tone === 'bad'
      ? 'text-rose-400 bg-rose-400/10 border-rose-500/20'
      : 'text-white/50 bg-white/5 border-white/10'

  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{arrow} {Math.abs(pct).toFixed(1)}%</span>
}

export default function MoMFeedback({ current, previous, fixedCategories }: MoMFeedbackProps) {
  if (!current || !previous) return null

  const getDespesas = (record: MonthRecord) => {
    const fixedSum = fixedCategories.reduce((acc, cat) => {
      if (cat.isDefault) {
        return acc + ((record[cat.id as keyof MonthRecord] as number) || 0)
      }
      const gasto = (record.demaisGastos || []).find((g) => g.nome === `[FIXA] ${cat.label}`)
      return acc + (gasto?.valor || 0)
    }, 0)

    const eventuais = (record.demaisGastos || [])
      .filter((g) => !g.nome.startsWith('[FIXA] '))
      .reduce((acc, g) => acc + g.valor, 0)

    return fixedSum + eventuais
  }

  const curReceitas = (current.meuSalario || 0) + (current.salarioEsposa || 0)
  const prevReceitas = (previous.meuSalario || 0) + (previous.salarioEsposa || 0)
  const curDespesas = getDespesas(current)
  const prevDespesas = getDespesas(previous)
  const curSaldo = curReceitas - curDespesas
  const prevSaldo = prevReceitas - prevDespesas

  const rows: MetricRow[] = [
    { id: 'receitas', label: 'Receitas Totais', currentValue: curReceitas, previousValue: prevReceitas, goodWhenIncrease: true, icon: '💰' },
    { id: 'despesas', label: 'Despesas Totais', currentValue: curDespesas, previousValue: prevDespesas, goodWhenIncrease: false, icon: '📉' },
    { id: 'saldo', label: 'Saldo Final', currentValue: curSaldo, previousValue: prevSaldo, goodWhenIncrease: true, icon: '📌' },
  ]

  for (const cat of fixedCategories) {
    let curVal = 0
    let prevVal = 0
    if (cat.isDefault) {
      curVal = (current[cat.id as keyof MonthRecord] as number) || 0
      prevVal = (previous[cat.id as keyof MonthRecord] as number) || 0
    } else {
      curVal = (current.demaisGastos || []).find((g) => g.nome === `[FIXA] ${cat.label}`)?.valor || 0
      prevVal = (previous.demaisGastos || []).find((g) => g.nome === `[FIXA] ${cat.label}`)?.valor || 0
    }

    if (curVal > 0 || prevVal > 0) {
      rows.push({
        id: `cat-${cat.id}`,
        label: cat.label,
        currentValue: curVal,
        previousValue: prevVal,
        goodWhenIncrease: false,
        icon: cat.icon,
      })
    }
  }

  const monthLabel = `${nomeMes(previous.month)} -> ${nomeMes(current.month)}`

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
          <p className="text-xs text-white/35">{monthLabel}</p>
        </div>
      </div>

      <div className="card-body space-y-3">
        {rows.map((row) => {
          const delta = calcDelta(row.currentValue, row.previousValue)
          const pct = calcPct(row.currentValue, row.previousValue)
          const tone = getTone(row.goodWhenIncrease, delta)
          const deltaPrefix = delta > 0 ? '+' : ''

          return (
            <div key={row.id} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white/90">
                  {row.icon ? `${row.icon} ` : ''}
                  {row.label}
                </div>
                <ToneBadge tone={tone} pct={pct} />
              </div>

              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                <div className="text-white/45">Anterior: <span className="text-white/75 font-semibold">{formatBRL(row.previousValue)}</span></div>
                <div className="text-white/45">Atual: <span className="text-white/95 font-semibold">{formatBRL(row.currentValue)}</span></div>
                <div className="text-white/45">
                  Diferença:{' '}
                  <span className={`font-semibold ${tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : 'text-white/70'}`}>
                    {deltaPrefix}
                    {formatBRL(delta)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
