'use client'

import React from 'react'
import { nomeMes, mesAnterior, mesSeguinte, mesAtualStr } from '@/lib/utils'

interface MonthSelectorProps {
  activeMonth: string
  onChange: (month: string) => void
}

export default function MonthSelector({ activeMonth, onChange }: MonthSelectorProps) {
  const isAtual = activeMonth === mesAtualStr()

  return (
    <div className="month-selector-root flex items-center gap-2 animate-fade-in">
      {/* Cápsula do Seletor Symmetrical */}
      <div className="month-selector-main flex items-center gap-2 glass-card px-3 py-1 rounded-full border border-white/5">
        <button
          onClick={() => onChange(mesAnterior(activeMonth))}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90 cursor-pointer"
          title="Mês anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="min-w-[110px] text-center font-bold text-white text-xs uppercase tracking-widest select-none">
          {nomeMes(activeMonth)}
        </span>

        <button
          onClick={() => onChange(mesSeguinte(activeMonth))}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90 cursor-pointer"
          title="Próximo mês"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Botão Hoje Premium e Desacoplado */}
      {!isAtual && (
        <button
          onClick={() => onChange(mesAtualStr())}
          className="month-selector-today flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/20 hover:bg-violet-600 hover:text-white hover:border-violet-400 hover:shadow-[0_0_12px_hsla(250,89%,65%,0.3)] transition-all active:scale-95 cursor-pointer"
          title="Voltar para o mês atual"
        >
          <span className="relative flex h-1.5 w-2 ">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
          </span>
          <span style={{ paddingRight: '5px' }}>
  Hoje
</span>
        </button>
      )}
    </div>
  )
}
