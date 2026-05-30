'use client'
import { nomeMes, mesAnterior, mesSeguinte, mesAtualStr } from '@/lib/utils'

export default function MonthSelector({ activeMonth, onChange }) {
  const isAtual = activeMonth === mesAtualStr()

  return (
    <div className="flex items-center gap-3 glass-card px-5 py-2 rounded-full">
      <button
        onClick={() => onChange(mesAnterior(activeMonth))}
        className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
        title="Mês anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="min-w-[140px] text-center font-semibold text-white text-sm tracking-wide select-none">
        {nomeMes(activeMonth)}
      </span>

      <button
        onClick={() => onChange(mesSeguinte(activeMonth))}
        className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
        title="Próximo mês"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {!isAtual && (
        <button
          onClick={() => onChange(mesAtualStr())}
          className="ml-1 text-xs font-semibold px-3 py-1 rounded-full bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 hover:text-white border border-violet-500/30 transition-all"
          title="Voltar para o mês atual"
        >
          Hoje
        </button>
      )}
    </div>
  )
}
