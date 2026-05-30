// src/app/page.js
'use client'

import { useFinance } from '@/context/FinanceContext'
import { useState, useEffect, useMemo } from 'react'

export default function Home() {
  const {
    mesAtivo,
    historico,
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
  const [removingId, setRemovingId] = useState(null)

  // Cálculos para o dashboard
  const totalReceitas = (dados.receitas.meuSalario || 0) + (dados.receitas.salarioEsposa || 0)
  const totalDespesasFixas = Object.values(dados.despesasFixas).reduce((a, b) => a + (b || 0), 0)
  const totalDemaisGastos = dados.demaisGastos.reduce((a, b) => a + (b.valor || 0), 0)
  const totalDespesas = totalDespesasFixas + totalDemaisGastos
  const saldoRestante = totalReceitas - totalDespesas
  const percentualGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0

  // Determinar status do saldo
  const statusSaldo = saldoRestante < 0 ? 'perigo' : percentualGasto > 80 ? 'alerta' : 'ok'

  const saldoColor = {
    ok: 'text-emerald-400',
    alerta: 'text-amber-400',
    perigo: 'text-rose-400'
  }[statusSaldo]

  const saldoIcon = {
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
  }[statusSaldo]

  const saldoLabel = {
    ok: totalReceitas > 0 ? 'Orçamento Saudável ✓' : 'Nenhum dado',
    alerta: 'Saldo Apertado — Atenção!',
    perigo: 'Orçamento no Vermelho!'
  }[statusSaldo]

  const handleSubmitGasto = async (e) => {
    e.preventDefault()
    if (novoGastoNome.trim() && parseFloat(novoGastoValor) > 0) {
      adicionarGasto(novoGastoNome.trim(), parseFloat(novoGastoValor))
      setNovoGastoNome('')
      setNovoGastoValor('')
    }
  }

  const handleDeleteGasto = (id) => {
    setRemovingId(id)
    setTimeout(() => {
      removerGasto(id)
      setRemovingId(null)
    }, 220)
  }

  // Renderizar Conselheiro Financeiro
  const renderConselheiro = () => {
    if (totalReceitas === 0) {
      return (
        <div className="alert-card alert-success">
          <div className="alert-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div className="alert-card-content">
            <h4>Primeiros Passos</h4>
            <p>Preencha as suas <strong>Receitas Familiares</strong> acima para ativar o Conselheiro Inteligente e receber análises de saúde financeira em tempo real.</p>
          </div>
        </div>
      )
    }

    if (percentualGasto > 80) {
      return (
        <div className="alert-card alert-danger">
          <div className="alert-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1={12} y1={8} x2={12} y2={12} />
              <line x1={12} y1={16} x2={12.01} y2={16} />
            </svg>
          </div>
          <div className="alert-card-content">
            <h4>Alerta Vermelho: Orçamento Extremamente Comprometido!</h4>
            <p>Você está consumindo <strong>{percentualGasto.toFixed(1)}%</strong> da sua renda total com despesas corporativas e familiares.</p>
            <p className="mt-4"><strong>Recomendação imediata:</strong> Evite qualquer nova dívida. Foque em revisar e eliminar despesas na seção de <strong>"Demais Gastos"</strong>.</p>
          </div>
        </div>
      )
    }

    if (saldoRestante > 0) {
      const valorNecessidades = saldoRestante * 0.50
      const valorDesejos = saldoRestante * 0.30
      const valorInvestimentos = saldoRestante * 0.20

      return (
        <div className="alert-card alert-success">
          <div className="alert-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="alert-card-content">
            <h4>Excelente! Suas contas estão em uma faixa segura.</h4>
            <p>Você está comprometendo apenas <strong>{percentualGasto.toFixed(1)}%</strong> de sua renda familiar.</p>
            <p className="mt-4">Para potencializar a sua saúde financeira, sugerimos a <strong>Regra 50-30-20</strong> aplicada ao seu saldo líquido restante de <strong>{formatarBRL(saldoRestante)}</strong>:</p>
            <div className="distribution-table">
              <div className="distribution-col">
                <div className="dist-percent">50%</div>
                <div className="dist-label">Necessidades</div>
                <div className="dist-value">{formatarBRL(valorNecessidades)}</div>
              </div>
              <div className="distribution-col">
                <div className="dist-percent">30%</div>
                <div className="dist-label">Desejos Livres</div>
                <div className="dist-value">{formatarBRL(valorDesejos)}</div>
              </div>
              <div className="distribution-col">
                <div className="dist-percent">20%</div>
                <div className="dist-label">Investimentos / Reserva</div>
                <div className="dist-value" style={{ color: '#34d399' }}>{formatarBRL(valorInvestimentos)}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // Renderizar Análise Comparativa Mensal
  const renderComparativo = () => {
    const mesAnteriorStr = obterMesAnterior(mesAtivo)
    const dadosAnterior = historico[mesAnteriorStr]

    if (!dadosAnterior) {
      return (
        <div className="comparativo-item comparativo-neutro">
          📊 Dica: Insira dados em meses anteriores (clicando no botão "◀" no topo para voltar no tempo) para ativar a análise comparativa automatizada de despesas.
        </div>
      )
    }

    const insights = []
    const recAtual = totalReceitas
    const recAnterior = (dadosAnterior.receitas.meuSalario || 0) + (dadosAnterior.receitas.salarioEsposa || 0)
    const deltaRec = recAtual - recAnterior

    if (deltaRec > 0) {
      insights.push({ tipo: 'positivo', titulo: 'Ganho de Receita Familiar', descricao: `Renda total da casa subiu <strong>${formatarBRL(deltaRec)}</strong> comparado ao mês anterior.` })
    } else if (deltaRec < 0) {
      insights.push({ tipo: 'negativo', titulo: 'Redução de Renda Familiar', descricao: `A renda total recuou em <strong>${formatarBRL(Math.abs(deltaRec))}</strong> comparado ao mês passado.` })
    }

    const despFixasAnt = Object.values(dadosAnterior.despesasFixas).reduce((a, b) => a + (b || 0), 0)
    const despDinAnt = dadosAnterior.demaisGastos.reduce((a, b) => a + (b.valor || 0), 0)
    const totalDespAnt = despFixasAnt + despDinAnt
    const deltaDesp = totalDespesas - totalDespAnt

    if (deltaDesp < 0) {
      insights.push({ tipo: 'positivo', titulo: 'Redução Geral nas Despesas', descricao: `Excelente! A família economizou <strong>${formatarBRL(Math.abs(deltaDesp))}</strong> no total de gastos.` })
    } else if (deltaDesp > 0) {
      insights.push({ tipo: 'negativo', titulo: 'Alta Geral nas Despesas', descricao: `Alerta: As despesas gerais aumentaram <strong>${formatarBRL(deltaDesp)}</strong> comparado ao mês passado.` })
    }

    if (insights.length === 0) {
      return <div className="comparativo-item comparativo-neutro">⚖️ Seus gastos estão estáveis (variação menor que 5%) em relação ao mês anterior.</div>
    }

    return (
      <ul className="comparativo-list">
        {insights.map((ins, idx) => (
          <li key={idx} className={`comparativo-item comparativo-${ins.tipo}`}>
            <div className="comparativo-item-icon">
              {ins.tipo === 'positivo' ? '✓' : '⚠️'}
            </div>
            <div className="comparativo-content">
              <strong>{ins.titulo}:</strong> {ins.descricao}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-area">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h1>FinFamília</h1>
              <p className="subtitle">Planejamento e Harmonia Financeira Familiar</p>
            </div>
          </div>
          <div className="header-badge" style={{ gap: '12px' }}>
            <button onClick={() => mudarMes(obterMesAnterior(mesAtivo))} className="btn-nav-mes" title="Mês Anterior">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="nav-svg">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span id="current-month-year">{obterNomeMes(mesAtivo)}</span>
            <button onClick={() => mudarMes(obterMesSeguinte(mesAtivo))} className="btn-nav-mes" title="Próximo Mês">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="nav-svg">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Coluna da Esquerda */}
        <section className="entries-column">
          {/* Receitas */}
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
                <div className="input-field">
                  <label>Meu Salário (R$)</label>
                  <div className="input-wrapper">
                    <span className="currency-prefix">R$</span>
                    <input
                      type="number"
                      value={dados.receitas.meuSalario || ''}
                      onChange={(e) => atualizarReceita('meuSalario', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="input-field">
                  <label>Salário da Esposa (R$)</label>
                  <div className="input-wrapper">
                    <span className="currency-prefix">R$</span>
                    <input
                      type="number"
                      value={dados.receitas.salarioEsposa || ''}
                      onChange={(e) => atualizarReceita('salarioEsposa', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
              <div className="section-summary-row mt-4">
                <span>Soma das Receitas:</span>
                <strong>{formatarBRL(totalReceitas)}</strong>
              </div>
            </div>
          </div>

          {/* Despesas Fixas */}
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
              <h2>Despesas Fixas (Contas do Mês)</h2>
            </div>
            <div className="card-body">
              <div className="grid-fields">
                {[
                  { id: 'agua', label: 'Água', color: 'text-blue', icon: '💧' },
                  { id: 'luz', label: 'Luz', color: 'text-yellow', icon: '⚡' },
                  { id: 'parcelaCasa', label: 'Parcela Casa / Aluguel', color: 'text-purple', icon: '🏠' },
                  { id: 'internet', label: 'Internet', color: 'text-cyan', icon: '🌐' },
                  { id: 'seguroMoto', label: 'Seguro da Moto', color: 'text-orange', icon: '🛵' },
                  { id: 'feira', label: 'Feira / Supermercado', color: 'text-green', icon: '🛒' }
                ].map(({ id, label, color, icon }) => (
                  <div className="input-field" key={id}>
                    <label className="flex-label">
                      <span className={`label-svg ${color}`}>{icon}</span>
                      {label}
                    </label>
                    <div className="input-wrapper">
                      <span className="currency-prefix">R$</span>
                      <input
                        type="number"
                        value={dados.despesasFixas[id] || ''}
                        onChange={(e) => atualizarDespesaFixa(id, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coluna da Direita */}
        <section className="dashboard-column">
          {/* Dashboard Cards */}
          <div className="dashboard-grid">
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
              <div className="metric-value">{formatarBRL(totalReceitas)}</div>
              <div className="metric-footer">Soma dos salários informados</div>
            </div>

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
              <div className="metric-value">{formatarBRL(totalDespesas)}</div>
              <div className="metric-footer">Fixas + Demais Gastos</div>
            </div>

            <div className={`metric-card glass-card fade-in delay-2 ${saldoColor}`} id="card-saldo-restante">
              <div className="metric-header">
                <span className="metric-title">Saldo Restante</span>
                <div className="metric-icon-small">
                  {saldoIcon}
                </div>
              </div>
              <div className="metric-value">{formatarBRL(saldoRestante)}</div>
              <div className="metric-footer">{saldoLabel}</div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="card glass-card fade-in delay-2 mt-4">
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
          <div className="card glass-card fade-in delay-3 mt-4" id="demais-gastos-section">
            <div className="card-header">
              <div className="card-icon dynamic-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h2>Demais Gastos (Dinâmicos / Eventuais)</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmitGasto} className="inline-form">
                <div className="input-field flex-2">
                  <label>Nome do Gasto</label>
                  <input
                    type="text"
                    value={novoGastoNome}
                    onChange={(e) => setNovoGastoNome(e.target.value)}
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
                      value={novoGastoValor}
                      onChange={(e) => setNovoGastoValor(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
                <div className="btn-container">
                  <button type="submit" className="btn btn-primary">
                    <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Adicionar
                  </button>
                </div>
              </form>

              <div className="dynamic-list-wrapper mt-4">
                <h3 className="list-title">Gastos Ativos</h3>
                <ul id="lista-demais-gastos" className="dynamic-list">
                  {dados.demaisGastos.length === 0 ? (
                    <li className="empty-list-message">Nenhum gasto dinâmico cadastrado.</li>
                  ) : (
                    dados.demaisGastos.map(gasto => (
                      <li key={gasto.id} className={`dynamic-list-item ${removingId === gasto.id ? 'removing' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">{gasto.nome}</span>
                          <span className="item-tag">Dinâmico</span>
                        </div>
                        <div className="item-action-area">
                          <span className="item-value">{formatarBRL(gasto.valor)}</span>
                          <button onClick={() => handleDeleteGasto(gasto.id)} className="btn-delete">
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

          {/* Conselheiro Financeiro */}
          <div className="card glass-card fade-in delay-4 mt-4" id="conselheiro-section">
            <div className="card-header">
              <div className="card-icon advisor-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <h2>Dicas para Sobrar Mais Renda (Conselheiro)</h2>
            </div>
            <div className="card-body">
              <div id="conselheiro-alertas-container">
                {renderConselheiro()}
              </div>
              <div id="comparativo-mensal-container">
                {renderComparativo()}
              </div>
              <h3 className="subsection-title mt-4">Orientações de Ouro para a Família</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <div className="tip-icon">💰</div>
                  <div className="tip-content">
                    <h4>Revise Assinaturas</h4>
                    <p>Revise streamings e assinaturas que não foram usadas nos últimos 30 dias. Cancelá-las gera um alívio imediato no orçamento.</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">⚡</div>
                  <div className="tip-content">
                    <h4>Consumo Consciente</h4>
                    <p>Tente reduzir o consumo de energia e água nas próximas semanas. Banhos ligeiramente mais curtos e apagar luzes faz diferença real no final do mês.</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">💳</div>
                  <div className="tip-content">
                    <h4>Evite Parcelamentos</h4>
                    <p>Evite parcelamentos longos em compras que não sejam necessidades básicas urgentes. O acúmulo de parcelas pequenas "sufoca" a sua renda futura.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer-bar">
        <p>© 2026 FinFamília. Desenvolvido com foco em prosperidade e estabilidade familiar.</p>
      </footer>
    </div>
  )
}