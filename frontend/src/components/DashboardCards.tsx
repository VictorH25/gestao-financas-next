'use client'

import React from 'react'
import { formatBRL } from '@/lib/utils'

interface DashboardCardsProps {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  percentual: number
}

type StatusSaldo = 'ok' | 'alerta' | 'perigo'

export default function DashboardCards({ totalReceitas, totalDespesas, saldo, percentual }: DashboardCardsProps) {
  const statusSaldo: StatusSaldo = saldo < 0 ? 'perigo' : percentual > 80 ? 'alerta' : 'ok'

  const saldoColor: Record<StatusSaldo, string> = {
    ok: 'text-emerald',
    alerta: 'text-amber',
    perigo: 'text-rose'
  }

  const saldoIcon: Record<StatusSaldo, React.ReactNode> = {
    ok: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={10} />
        <path d="m8 11.5 3 3 5-5" />
      </svg>
    ),
    alerta: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1={12} y1={9} x2={12} y2={13} />
        <line x1={12} y1={17} x2={12.01} y2={17} />
      </svg>
    ),
    perigo: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={10} />
        <line x1={12} y1={8} x2={12} y2={12} />
        <line x1={12} y1={16} x2={12.01} y2={16} />
      </svg>
    )
  }

  const saldoLabel: Record<StatusSaldo, string> = {
    ok: totalReceitas > 0 ? 'Orçamento Saudável ✓' : 'Nenhum dado',
    alerta: 'Saldo Apertado — Atenção!',
    perigo: 'Orçamento no Vermelho!'
  }

  return (
    <div className="space-y-4">
      {/* 3 metric cards */}
      <div className="dashboard-grid">
        {/* Receitas */}
        <div className="metric-card glass-card text-emerald fade-in">
          <div className="metric-header">
            <span className="metric-title">Total Receitas</span>
            <div className="metric-icon-small">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{formatBRL(totalReceitas)}</div>
          <div className="metric-footer">Soma dos salários informados</div>
        </div>

        {/* Despesas */}
        <div className="metric-card glass-card text-rose fade-in delay-1">
          <div className="metric-header">
            <span className="metric-title">Total Despesas</span>
            <div className="metric-icon-small">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{formatBRL(totalDespesas)}</div>
          <div className="metric-footer">Fixas + Demais Gastos</div>
        </div>

        {/* Saldo */}
        <div className={`metric-card glass-card fade-in delay-2 ${saldoColor[statusSaldo]}`} id="card-saldo-restante">
          <div className="metric-header">
            <span className="metric-title">Saldo Restante</span>
            <div className="metric-icon-small">
              {saldoIcon[statusSaldo]}
            </div>
          </div>
          <div className="metric-value">{formatBRL(saldo)}</div>
          <div className="metric-footer">{saldoLabel[statusSaldo]}</div>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="card glass-card fade-in delay-2">
        <div className="budget-progress-container">
          <div className="budget-progress-info">
            <span>Orçamento Familiar Comprometido</span>
            <strong>{percentual.toFixed(1)}%</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${Math.min(percentual, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
