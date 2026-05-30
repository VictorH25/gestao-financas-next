// src/components/DynamicExpenses.tsx
'use client'

import React, { useState, useRef } from 'react'
import { formatBRL } from '@/lib/utils'
import { DynamicExpense } from '@/types'

interface DynamicExpensesProps {
  items: DynamicExpense[]
  onAdd: (nome: string, valor: number) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
}

export default function DynamicExpenses({ items, onAdd, onDelete }: DynamicExpensesProps) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseFloat(valor)
    if (!nome.trim() || !v || v <= 0) return
    setLoading(true)
    await onAdd(nome.trim(), v)
    setNome('')
    setValor('')
    setLoading(false)
    nameRef.current?.focus()
  }

  const handleDelete = async (id: string) => {
    setRemovingId(id)
    // Small delay to allow animation
    await new Promise(r => setTimeout(r, 220))
    await onDelete(id)
    setRemovingId(null)
  }

  const handleKeyPressNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
      e.preventDefault();
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      return;
    }

    if (e.key === '.' || e.key === ',') {
      const val = (e.target as HTMLInputElement).value;
      if (!val.includes('.') && !val.includes(',')) {
        return;
      }
    }

    e.preventDefault();
  }

  return (
    <div className="card glass-card fade-in delay-3" id="demais-gastos-section">
      <div className="card-header">
        <div className="card-icon dynamic-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} />
            <line x1={12} y1={8} x2={12} y2={16} />
            <line x1={8} y1={12} x2={16} y2={12} />
          </svg>
        </div>
        <h2>Demais Gastos (Dinâmicos / Eventuais)</h2>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="input-field flex-2">
            <label>Nome do Gasto</label>
            <input
              ref={nameRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Parcela da Geladeira"
              required
            />
          </div>
          <div className="input-field flex-1">
            <label>Valor (R$)</label>
            <div className="input-wrapper">
              <span className="currency-prefix">R$</span>
              <input
                type="number"
                inputMode="decimal"
                onKeyDown={handleKeyPressNumeric}
                value={valor}
                onChange={(e) => setValor(e.target.value.replace(',', '.'))}
                min="0.01"
                step="0.01"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div className="btn-container">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>

        <div className="dynamic-list-wrapper mt-4">
          <h3 className="list-title">Gastos Ativos</h3>
          <ul id="lista-demais-gastos" className="dynamic-list">
            {items.length === 0 ? (
              <li className="empty-list-message">Nenhum gasto dinâmico cadastrado.</li>
            ) : (
              items.map(item => (
                <li key={item.id} className={`dynamic-list-item ${removingId === item.id ? 'removing' : ''}`}>
                  <div className="item-info">
                    <span className="item-name">{item.nome}</span>
                    <span className="item-tag">Dinâmico</span>
                  </div>
                  <div className="item-action-area">
                    <span className="item-value">{formatBRL(item.valor)}</span>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete" title="Excluir gasto">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
