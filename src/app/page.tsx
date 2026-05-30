// src/app/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useFinance } from '@/context/FinanceContext'
import MonthSelector from '@/components/MonthSelector'
import DashboardCards from '@/components/DashboardCards'
import IncomeAndFixedExpenses from '@/components/IncomeAndFixedExpenses'
import DynamicExpenses from '@/components/DynamicExpenses'
import MoMFeedback from '@/components/MoMFeedback'

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
    obterMesSeguinte,
    loading,
    fixedCategories
  } = useFinance()

  const dados = obterDadosMesAtivo()

  // Registro do Service Worker do PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registrado com sucesso:', reg.scope))
        .catch((err) => console.error('Erro ao registrar PWA Service Worker:', err))
    }
  }, [])

  // Cálculos para o dashboard
  const totalReceitas = (dados.meuSalario || 0) + (dados.salarioEsposa || 0)
  
  const totalDespesasFixas = fixedCategories.reduce((acc, cat) => {
    if (cat.isDefault) {
      return acc + (dados[cat.id as keyof typeof dados] as number || 0)
    } else {
      const gasto = (dados.demaisGastos || []).find(g => g.nome === `[FIXA] ${cat.label}`)
      return acc + (gasto?.valor || 0)
    }
  }, 0)

  const totalDemaisGastos = (dados.demaisGastos || []).filter(g => !g.nome.startsWith('[FIXA] ')).reduce((a, b) => a + (b.valor || 0), 0)
  const totalDespesas = totalDespesasFixas + totalDemaisGastos
  const saldoRestante = totalReceitas - totalDespesas
  const percentualGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0

  const handleFieldChange = (field: string, value: number) => {
    if (field === 'meuSalario' || field === 'salarioEsposa') {
      atualizarReceita(field, value)
    } else {
      atualizarDespesaFixa(field, value)
    }
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
            <p>Preencha as suas <strong>Receitas Familiares</strong> para ativar o Conselheiro Inteligente e receber análises de saúde financeira em tempo real.</p>
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

  const previousMonthStr = obterMesAnterior(mesAtivo)
  const previousMonthData = historico[previousMonthStr]

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
          
          <MonthSelector activeMonth={mesAtivo} onChange={mudarMes} />
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main relative" key={mesAtivo}>
        {/* Indicador de carregamento sutil */}
        {loading && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-violet-600/80 backdrop-blur border border-violet-500/20 px-3.5 py-1.5 rounded-full z-10 text-xs font-bold text-white shadow-lg animate-pulse">
            <span className="inline-block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sincronizando...
          </div>
        )}

        {/* Coluna da Esquerda: Entradas */}
        <section className="entries-column">
          <IncomeAndFixedExpenses 
            data={dados} 
            onFieldChange={handleFieldChange} 
          />
        </section>

        {/* Coluna da Direita: Dashboards & Gastos Eventuais */}
        <section className="dashboard-column space-y-6">
          <DashboardCards 
            totalReceitas={totalReceitas} 
            totalDespesas={totalDespesas} 
            saldo={saldoRestante} 
            percentual={percentualGasto} 
          />

          <DynamicExpenses 
            items={(dados.demaisGastos || []).filter(g => !g.nome.startsWith('[FIXA] '))} 
            onAdd={adicionarGasto} 
            onDelete={removerGasto} 
          />

          {/* Comparativo Mensal Automatizado */}
          <MoMFeedback 
            current={dados} 
            previous={previousMonthData} 
            fixedCategories={fixedCategories}
          />

          {/* Conselheiro Financeiro */}
          <div className="card glass-card fade-in delay-4" id="conselheiro-section">
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
            <div className="card-body space-y-4">
              <div id="conselheiro-alertas-container">
                {renderConselheiro()}
              </div>

              <h3 className="subsection-title pt-2">Orientações de Ouro para a Família</h3>
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
