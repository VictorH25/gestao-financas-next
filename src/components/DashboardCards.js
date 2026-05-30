'use client'
import { formatBRL } from '@/lib/utils'

export default function DashboardCards({ totalReceitas, totalDespesas, saldo, percentual }) {
  const statusSaldo = saldo < 0 ? 'perigo' : percentual > 80 ? 'alerta' : 'ok'

  const saldoColor = {
    ok: 'text-emerald-400',
    alerta: 'text-amber-400',
    perigo: 'text-rose-400',
  }[statusSaldo]

  const barColor = percentual > 80
    ? 'from-amber-500 to-rose-500'
    : 'from-emerald-500 to-violet-500'

  const saldoIcon = {
    ok: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={10} /><path d="m8 11.5 3 3 5-5" />
      </svg>
    ),
    alerta: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} />
      </svg>
    ),
    perigo: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} />
      </svg>
    ),
  }[statusSaldo]

  const saldoLabel = {
    ok: totalReceitas > 0 ? 'Orçamento Saudável ✓' : 'Nenhum dado',
    alerta: 'Saldo Apertado — Atenção!',
    perigo: 'Orçamento no Vermelho!',
  }[statusSaldo]

  return (
    <div className="space-y-4">
      {/* 3 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Total Receitas</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-400/15 text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">{formatBRL(totalReceitas)}</p>
          <p className="text-xs text-white/30 mt-1">Soma dos salários informados</p>
        </div>

        {/* Despesas */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in [animation-delay:0.1s]">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Total Despesas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-400/15 text-rose-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 tracking-tight">{formatBRL(totalDespesas)}</p>
          <p className="text-xs text-white/30 mt-1">Fixas + Demais Gastos</p>
        </div>

        {/* Saldo */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in [animation-delay:0.2s]">
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${saldoColor.replace('text-','bg-')}`} />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Saldo Restante</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${saldoColor} bg-white/5`}>
              {saldoIcon}
            </div>
          </div>
          <p className={`text-2xl font-extrabold tracking-tight ${saldoColor}`}>{formatBRL(saldo)}</p>
          <p className="text-xs text-white/30 mt-1">{saldoLabel}</p>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="glass-card rounded-2xl px-6 py-4 animate-fade-in [animation-delay:0.25s]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white/60">Orçamento Familiar Comprometido</span>
          <span className={`text-sm font-extrabold ${percentual > 80 ? 'text-rose-400' : 'text-white'}`}>
            {percentual.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full bg-gradient-to-r progress-fill ${barColor}`}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
