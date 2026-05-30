'use client'
import { useState, useRef } from 'react'
import { formatBRL } from '@/lib/utils'

export default function DynamicExpenses({ items, onAdd, onDelete }) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const nameRef = useRef(null)

  const handleSubmit = async (e) => {
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

  const handleDelete = async (id) => {
    setRemovingId(id)
    // Small delay to allow animation
    await new Promise(r => setTimeout(r, 220))
    await onDelete(id)
    setRemovingId(null)
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in [animation-delay:0.3s]">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-sky-400/15 text-sky-400 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={16} /><line x1={8} y1={12} x2={16} y2={12} />
          </svg>
        </div>
        <h2 className="text-base font-bold text-white">Demais Gastos (Eventuais)</h2>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            ref={nameRef}
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome do gasto (ex: Parcela da Geladeira)"
            required
            className="flex-[2] px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all placeholder:text-white/20"
          />
          <div className="relative flex-1 min-w-[120px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 pointer-events-none">R$</span>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              min={0.01}
              step={0.01}
              required
              className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all placeholder:text-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-900/40 disabled:opacity-60 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
            </svg>
            {loading ? 'Adicionando…' : 'Adicionar'}
          </button>
        </form>

        {/* List */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 pb-2 border-b border-white/5 mb-3">
            Gastos Ativos
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-white/25 italic text-center py-4">Nenhum gasto dinâmico cadastrado.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 bg-white/5 border border-white/[0.07] rounded-xl transition-all animate-scale-in ${removingId === item.id ? 'animate-slide-out' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{item.nome}</span>
                    <span className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Eventual
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white">{formatBRL(item.valor)}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={removingId === item.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                      title="Excluir gasto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
