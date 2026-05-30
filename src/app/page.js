// src/app/page.js
'use client'

import { useFinance } from '@/context/FinanceContext'
import { useState, useMemo } from 'react'

export default function Home() {
  const {
    mesAtivo,
    obterDadosMesAtivo,
    atualizarReceita,
    atualizarDespesaFixa,
    adicionarGasto,
    removerGasto,
    mudarMes,
    formatarBRL,
    obterNomeMes,
    obterMesAnterior,
    obterMesSeguinte
  } = useFinance()

  const dados = obterDadosMesAtivo()
  const [novoGastoNome, setNovoGastoNome] = useState('')
  const [novoGastoValor, setNovoGastoValor] = useState('')

  // Cálculos para o dashboard
  const totalReceitas = (dados.receitas.meuSalario || 0) + (dados.receitas.salarioEsposa || 0)
  const totalDespesasFixas = Object.values(dados.despesasFixas).reduce((a, b) => a + (b || 0), 0)
  const totalDemaisGastos = dados.demaisGastos.reduce((a, b) => a + (b.valor || 0), 0)
  const totalDespesas = totalDespesasFixas + totalDemaisGastos
  const saldoRestante = totalReceitas - totalDespesas
  const percentualGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0

  const handleSubmitGasto = (e) => {
    e.preventDefault()
    if (novoGastoNome.trim() && novoGastoValor > 0) {
      adicionarGasto(novoGastoNome.trim(), parseFloat(novoGastoValor))
      setNovoGastoNome('')
      setNovoGastoValor('')
    }
  }

  const statusSaldo = saldoRestante < 0 ? 'perigo' : percentualGasto > 80 ? 'alerta' : 'ok'

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-area">
            <div className="logo-icon">💰</div>
            <div>
              <h1>FinFamília</h1>
              <p className="subtitle">Planejamento e Harmonia Financeira Familiar</p>
            </div>
          </div>
          <div className="header-badge">
            <button onClick={() => mudarMes(obterMesAnterior(mesAtivo))} className="btn-nav-mes">
              ◀
            </button>
            <span id="current-month-year">{obterNomeMes(mesAtivo)}</span>
            <button onClick={() => mudarMes(obterMesSeguinte(mesAtivo))} className="btn-nav-mes">
              ▶
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Coluna da Esquerda */}
        <section className="entries-column">
          {/* Receitas */}
          <div className="card glass-card">
            <div className="card-header">
              <div className="card-icon income-icon">💰</div>
              <h2>Receitas Familiares (Entradas)</h2>
            </div>
            <div className="card-body">
              <div className="input-group-row">
                <div className="input-field">
                  <label>Meu Salário (R$)</label>
                  <input
                    type="number"
                    value={dados.receitas.meuSalario || ''}
                    onChange={(e) => atualizarReceita('meuSalario', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="input-field">
                  <label>Salário da Esposa (R$)</label>
                  <input
                    type="number"
                    value={dados.receitas.salarioEsposa || ''}
                    onChange={(e) => atualizarReceita('salarioEsposa', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="section-summary-row">
                <span>Soma das Receitas:</span>
                <strong>{formatarBRL(totalReceitas)}</strong>
              </div>
            </div>
          </div>

          {/* Despesas Fixas - continue com todos os campos */}
          <div className="card glass-card">
            <div className="card-header">
              <div className="card-icon expense-icon">📋</div>
              <h2>Despesas Fixas (Contas do Mês)</h2>
            </div>
            <div className="card-body">
              <div className="grid-fields">
                {[
                  { id: 'agua', label: 'Água' },
                  { id: 'luz', label: 'Luz' },
                  { id: 'parcelaCasa', label: 'Parcela Casa / Aluguel' },
                  { id: 'internet', label: 'Internet' },
                  { id: 'seguroMoto', label: 'Seguro da Moto' },
                  { id: 'feira', label: 'Feira / Supermercado' }
                ].map(({ id, label }) => (
                  <div className="input-field" key={id}>
                    <label>{label}</label>
                    <input
                      type="number"
                      value={dados.despesasFixas[id] || ''}
                      onChange={(e) => atualizarDespesaFixa(id, parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coluna da Direita */}
        <section className="dashboard-column">
          {/* Cards */}
          <div className="dashboard-grid">
            <div className={`metric-card glass-card ${statusSaldo === 'ok' ? 'text-emerald' : statusSaldo === 'alerta' ? 'text-amber' : 'text-rose'}`}>
              <div className="metric-header">
                <span>Total Receitas</span>
              </div>
              <div className="metric-value">{formatarBRL(totalReceitas)}</div>
            </div>
            <div className="metric-card glass-card text-rose">
              <div className="metric-header">
                <span>Total Despesas</span>
              </div>
              <div className="metric-value">{formatarBRL(totalDespesas)}</div>
            </div>
            <div className="metric-card glass-card">
              <div className="metric-header">
                <span>Saldo Restante</span>
              </div>
              <div className="metric-value" style={{ color: saldoRestante >= 0 ? '#34d399' : '#f87171' }}>
                {formatarBRL(saldoRestante)}
              </div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="card glass-card">
            <div className="budget-progress-container">
              <div className="budget-progress-info">
                <span>Orçamento Familiar Comprometido</span>
                <strong>{percentualGasto.toFixed(1)}%</strong>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${Math.min(percentualGasto, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Demais Gastos */}
          <div className="card glass-card">
            <div className="card-header">
              <div className="card-icon dynamic-icon">➕</div>
              <h2>Demais Gastos (Dinâmicos / Eventuais)</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmitGasto} className="inline-form">
                <input
                  type="text"
                  placeholder="Nome do gasto"
                  value={novoGastoNome}
                  onChange={(e) => setNovoGastoNome(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Valor"
                  value={novoGastoValor}
                  onChange={(e) => setNovoGastoValor(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                />
                <button type="submit" className="btn btn-primary">Adicionar</button>
              </form>

              <ul className="dynamic-list">
                {dados.demaisGastos.length === 0 ? (
                  <li className="empty-list-message">Nenhum gasto dinâmico cadastrado.</li>
                ) : (
                  dados.demaisGastos.map(gasto => (
                    <li key={gasto.id} className="dynamic-list-item">
                      <div className="item-info">
                        <span className="item-name">{gasto.nome}</span>
                        <span className="item-tag">Dinâmico</span>
                      </div>
                      <div className="item-action-area">
                        <span className="item-value">{formatarBRL(gasto.valor)}</span>
                        <button onClick={() => removerGasto(gasto.id)} className="btn-delete">
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}