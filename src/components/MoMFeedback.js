'use client'
import { formatBRL } from '@/lib/utils'

const THRESHOLD_DANGER = 0.10   // +10% → negativo
const THRESHOLD_GOOD = -0.05    // -5%  → positivo

function DeltaBadge({ label, cur, prev }) {
  if (prev == null || prev === 0) return null
  const pct = ((cur - prev) / prev) * 100
  const isPositive = pct < 0      // para despesas, queda é positivo
  const isNegative = pct > 0

  const colorClass = isPositive ? 'bg-emerald-400/15 text-emerald-400 border-emerald-500/20'
    : isNegative ? 'bg-rose-400/15 text-rose-400 border-rose-500/20'
    : 'bg-white/5 text-white/40 border-white/5'

  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→'

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
      {arrow} {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

export default function MoMFeedback({ current, previous }) {
  if (!current || !previous) return null

  const fixedKeys = ['agua', 'luz', 'parcelaCasa', 'internet', 'seguroMoto', 'feira']
  const fixedLabels = {
    agua: 'Água', luz: 'Luz', parcelaCasa: 'Parcela da Casa',
    internet: 'Internet', seguroMoto: 'Seguro Moto', feira: 'Feira / Mercado',
  }

  const curTotal = (current.meuSalario || 0) + (current.salarioEsposa || 0)
  const prevTotal = (previous.meuSalario || 0) + (previous.salarioEsposa || 0)
  const curDespesas = fixedKeys.reduce((a, k) => a + (current[k] || 0), 0) +
    (current.demaisGastos || []).reduce((a, g) => a + g.valor, 0)
  const prevDespesas = fixedKeys.reduce((a, k) => a + (previous[k] || 0), 0) +
    (previous.demaisGastos || []).reduce((a, g) => a + g.valor, 0)

  const positives = []
  const negatives = []

  // Saldo comparado
  const curSaldo = curTotal - curDespesas
  const prevSaldo = prevTotal - prevDespesas
  if (prevSaldo !== 0) {
    const saldoChange = ((curSaldo - prevSaldo) / Math.abs(prevSaldo)) * 100
    if (saldoChange >= 5)  positives.push(`Saldo cresceu ${saldoChange.toFixed(0)}% em relação ao mês anterior`)
    if (saldoChange <= -5) negatives.push(`Saldo caiu ${Math.abs(saldoChange).toFixed(0)}% em relação ao mês anterior`)
  }

  // Despesas fixas individuais
  for (const k of fixedKeys) {
    const prev = previous[k] || 0
    const cur = current[k] || 0
    if (prev === 0) continue
    const pct = ((cur - prev) / prev) * 100
    if (pct >= THRESHOLD_DANGER * 100) negatives.push(`${fixedLabels[k]} aumentou ${pct.toFixed(0)}% (${formatBRL(prev)} → ${formatBRL(cur)})`)
    else if (pct <= THRESHOLD_GOOD * 100) positives.push(`${fixedLabels[k]} reduziu ${Math.abs(pct).toFixed(0)}% (${formatBRL(prev)} → ${formatBRL(cur)})`)
  }

  // Demais gastos
  if (prevDespesas > 0) {
    const dynCur = (current.demaisGastos || []).reduce((a, g) => a + g.valor, 0)
    const dynPrev = (previous.demaisGastos || []).reduce((a, g) => a + g.valor, 0)
    if (dynPrev > 0) {
      const pct = ((dynCur - dynPrev) / dynPrev) * 100
      if (pct >= THRESHOLD_DANGER * 100) negatives.push(`Gastos eventuais subiram ${pct.toFixed(0)}% (${formatBRL(dynPrev)} → ${formatBRL(dynCur)})`)
      if (pct <= THRESHOLD_GOOD * 100)   positives.push(`Gastos eventuais caíram ${Math.abs(pct).toFixed(0)}% — ótimo controle!`)
    }
  }

  if (positives.length === 0 && negatives.length === 0) return null

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in [animation-delay:0.4s]">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-violet-400/15 text-violet-400 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Análise vs. Mês Anterior</h2>
          <p className="text-xs text-white/30">Comparação automática com o mês anterior</p>
        </div>
      </div>

      <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
        {/* Saldo comparison */}
        <div className="col-span-full flex flex-wrap gap-4 pb-4 border-b border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/40 uppercase tracking-wider">Receitas este mês</span>
            <span className="text-lg font-extrabold text-emerald-400">{formatBRL(curTotal)}</span>
          </div>
          <DeltaBadge label="receitas" cur={curTotal} prev={prevTotal} />
          <div className="flex flex-col gap-1 ml-auto text-right">
            <span className="text-xs text-white/40 uppercase tracking-wider">Despesas este mês</span>
            <span className="text-lg font-extrabold text-rose-400">{formatBRL(curDespesas)}</span>
          </div>
          <DeltaBadge label="despesas" cur={curDespesas} prev={prevDespesas} />
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
