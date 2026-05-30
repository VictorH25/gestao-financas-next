'use client'
import { useCallback } from 'react'
import { formatBRL } from '@/lib/utils'

const RECEITAS = [
  { id: 'meuSalario', label: 'Meu Salário' },
  { id: 'salarioEsposa', label: 'Salário da Esposa' },
]

const FIXAS = [
  { id: 'agua',        label: 'Água',                   color: 'text-sky-400' },
  { id: 'luz',         label: 'Luz',                    color: 'text-yellow-400' },
  { id: 'parcelaCasa', label: 'Parcela Casa / Aluguel', color: 'text-violet-400' },
  { id: 'internet',    label: 'Internet',               color: 'text-cyan-400' },
  { id: 'seguroMoto',  label: 'Seguro da Moto',         color: 'text-orange-400' },
  { id: 'feira',       label: 'Feira / Supermercado',   color: 'text-emerald-400' },
]

function CurrencyInput({ id, label, value, colorClass = 'text-violet-400', onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${colorClass || 'text-white/50'}`}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 pointer-events-none select-none">R$</span>
        <input
          id={id}
          type="number"
          min={0}
          step={0.01}
          value={value || ''}
          placeholder="0,00"
          onChange={(e) => onChange(id, parseFloat(e.target.value) || 0)}
          className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all placeholder:text-white/20"
        />
      </div>
    </div>
  )
}

export default function IncomeAndFixedExpenses({ data, onFieldChange }) {
  const totalReceitas = (data.meuSalario || 0) + (data.salarioEsposa || 0)

  const handleChange = useCallback((field, value) => {
    onFieldChange(field, value)
  }, [onFieldChange])

  return (
    <div className="space-y-6">
      {/* Receitas */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-emerald-400/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x={2} y={5} width={20} height={14} rx={2} />
              <path d="M12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">Receitas Familiares</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RECEITAS.map(({ id, label }) => (
              <CurrencyInput
                key={id} id={id} label={label}
                value={data[id]}
                colorClass="text-emerald-400"
                onChange={handleChange}
              />
            ))}
          </div>
          <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-white/50">Total de Receitas</span>
            <strong className="text-xl font-extrabold text-emerald-400">{formatBRL(totalReceitas)}</strong>
          </div>
        </div>
      </div>

      {/* Despesas Fixas */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in [animation-delay:0.1s]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-rose-400/15 text-rose-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">Despesas Fixas (Contas do Mês)</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIXAS.map(({ id, label, color }) => (
              <CurrencyInput
                key={id} id={id} label={label}
                value={data[id]}
                colorClass={color}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
