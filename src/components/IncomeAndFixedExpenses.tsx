'use client'

import React, { useCallback, useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatBRL } from '@/lib/utils'
import { MonthRecord } from '@/types'

interface CurrencyInputProps {
  id: string
  label: string
  value: number | undefined
  icon?: string
  color?: string
  onChange: (id: string, value: number) => void
  onDelete?: () => void
}

function CurrencyInput({ id, label, value, icon, color, onChange, onDelete }: CurrencyInputProps) {
  const [draft, setDraft] = useState<string>(value && value !== 0 ? String(value) : '')
  const [isEditing, setIsEditing] = useState(false)

  const parseInputValue = (raw: string): number | null => {
    const normalized = raw.replace(',', '.').trim()
    if (normalized === '') return null
    const parsed = Number.parseFloat(normalized)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return parsed
  }

  const commitValue = () => {
    const parsed = parseInputValue(draft)
    onChange(id, parsed ?? 0)
  }

  const handleKeyPressNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]
    if (allowedKeys.includes(e.key)) return
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
      e.preventDefault()
      return
    }
    if (/^[0-9]$/.test(e.key)) return
    if (e.key === '.' || e.key === ',') {
      const val = (e.target as HTMLInputElement).value
      if (!val.includes('.') && !val.includes(',')) return
    }
    e.preventDefault()
  }

  return (
    <div className="input-field relative group">
      <label className={icon ? 'flex-label justify-between items-center w-full' : 'flex justify-between items-center w-full'}>
        <span className="flex items-center gap-1.5">
          {icon && <span className={`label-svg ${color}`}>{icon}</span>}
          {label}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
            title="Excluir categoria"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </label>
      <div className="input-wrapper">
        <span className="currency-prefix">R$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={isEditing ? draft : value && value !== 0 ? String(value) : ''}
          placeholder="0,00"
          onFocus={() => {
            setDraft(value && value !== 0 ? String(value) : '')
            setIsEditing(true)
          }}
          onBlur={() => {
            setIsEditing(false)
            commitValue()
          }}
          onKeyDown={(e) => {
            handleKeyPressNumeric(e)
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          onChange={(e) => {
            setDraft(e.target.value)
          }}
        />
      </div>
    </div>
  )
}

const RECEITAS = [
  { id: 'meuSalario', label: 'Salario do Marido (R$)' },
  { id: 'salarioEsposa', label: 'Salario da Esposa (R$)' },
]

interface IncomeAndFixedExpensesProps {
  data: MonthRecord
  onFieldChange: (field: string, value: number) => void
}

export default function IncomeAndFixedExpenses({ data, onFieldChange }: IncomeAndFixedExpensesProps) {
  const { fixedCategories, adicionarCategoriaFixa, removerCategoriaFixa, restaurarCategoriasPadrao, atualizarDespesaFixaDinamica } =
    useFinance()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('🚗')
  const [newCatColor, setNewCatColor] = useState('text-blue')

  const totalReceitas = (data.meuSalario || 0) + (data.salarioEsposa || 0)

  const handleChange = useCallback(
    (field: string, value: number) => {
      onFieldChange(field, value)
    },
    [onFieldChange]
  )

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatLabel.trim()) return
    adicionarCategoriaFixa(newCatLabel.trim(), newCatIcon, newCatColor)
    setNewCatLabel('')
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="card glass-card fade-in" id="receitas-section">
        <div className="card-header">
          <div className="card-icon income-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
              <line x1="12" y1="17" x2="12" y2="17" />
              <path d="M12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z" />
            </svg>
          </div>
          <h2>Receitas Familiares (Entradas)</h2>
        </div>
        <div className="card-body">
          <div className="input-group-row">
            {RECEITAS.map(({ id, label }) => (
              <CurrencyInput key={id} id={id} label={label} value={data[id as keyof MonthRecord] as number | undefined} onChange={handleChange} />
            ))}
          </div>
          <div className="section-summary-row mt-4">
            <span>Soma das Receitas:</span>
            <strong>{formatBRL(totalReceitas)}</strong>
          </div>
        </div>
      </div>

      <div className="card glass-card fade-in delay-1" id="despesas-fixas-section">
        <div className="card-header">
          <div className="card-icon expense-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2>Despesas Fixas (Contas do Mes)</h2>
        </div>
        <div className="card-body">
          <div className="grid-fields">
            {fixedCategories.map(({ id, label, color, icon, isDefault }) => (
              <CurrencyInput
                key={id}
                id={id}
                label={label}
                value={isDefault ? (data[id as keyof MonthRecord] as number | undefined) : (data.demaisGastos || []).find((g) => g.nome === `[FIXA] ${label}`)?.valor}
                icon={icon}
                color={color}
                onChange={isDefault ? handleChange : (_, val) => atualizarDespesaFixaDinamica(label, val)}
                onDelete={() => removerCategoriaFixa(id)}
              />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
            {!showAddForm ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="btn bg-white/5 hover:bg-white/10 text-white/80 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <span>Adicionar Conta</span>
                </button>

                {fixedCategories.length < 6 && (
                  <button
                    type="button"
                    onClick={restaurarCategoriasPadrao}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer font-medium"
                  >
                    Restaurar Padroes
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddCategorySubmit} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="input-field">
                    <label>Nome da Conta</label>
                    <input type="text" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="Ex: IPVA, Academia..." required />
                  </div>
                  <div className="input-field">
                    <label>Icone</label>
                    <div className="input-wrapper">
                      <select
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white text-sm font-semibold cursor-pointer"
                        style={{ height: '44px' }}
                      >
                        <option value="🚗">🚗 Carro</option>
                        <option value="🏍️">🏍️ Moto</option>
                        <option value="🏋️">🏋️ Academia</option>
                        <option value="🏫">🏫 Educacao</option>
                        <option value="🏥">🏥 Saude / Remedio</option>
                        <option value="🍿">🍿 Assinaturas / Lazer</option>
                        <option value="🐶">🐶 Pet</option>
                        <option value="👔">👔 Vestuario</option>
                        <option value="💡">💡 Geral / Outros</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Cor de Destaque:</label>
                    <div className="flex gap-1.5">
                      {['text-blue', 'text-yellow', 'text-purple', 'text-cyan', 'text-orange', 'text-green'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCatColor(c)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                            newCatColor === c ? 'border-white scale-110 shadow-lg animate-pulse' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: `var(--color-${c.replace('text-', '')})` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="btn bg-white/5 text-white/60 hover:bg-white/10 text-xs py-1.5 px-3 font-semibold">
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary text-xs py-1.5 px-3 font-bold">
                      Salvar
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
