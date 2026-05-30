// src/context/FinanceContext.js
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const FinanceContext = createContext()

// Utilitários
const formatarBRL = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

const obterNomeMes = (mesAnoStr) => {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  const [ano, mes] = mesAnoStr.split('-').map(Number)
  return `${meses[mes - 1]} de ${ano}`
}

const obterMesAnterior = (mesAnoStr) => {
  const [ano, mes] = mesAnoStr.split('-').map(Number)
  let prevMes = mes - 1
  let prevAno = ano
  if (prevMes === 0) {
    prevMes = 12
    prevAno = ano - 1
  }
  return `${prevAno}-${prevMes.toString().padStart(2, '0')}`
}

const obterMesSeguinte = (mesAnoStr) => {
  const [ano, mes] = mesAnoStr.split('-').map(Number)
  let nextMes = mes + 1
  let nextAno = ano
  if (nextMes === 13) {
    nextMes = 1
    nextAno = ano + 1
  }
  return `${nextAno}-${nextMes.toString().padStart(2, '0')}`
}

export function FinanceProvider({ children }) {
  const [mesAtivo, setMesAtivo] = useState("2026-05")
  const [historico, setHistorico] = useState({})
  const [loading, setLoading] = useState(true)

  // Carregar dados do localStorage
  useEffect(() => {
    const carregarEstado = () => {
      const salvo = localStorage.getItem('finfamilia_estado_v2')
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo)
          if (parsed.historico && parsed.mesAtivo) {
            setHistorico(parsed.historico)
            setMesAtivo(parsed.mesAtivo)
            setLoading(false)
            return
          }
        } catch (e) {
          console.error("Erro ao ler dados", e)
        }
      }
      
      // Dados iniciais
      setHistorico({
        "2026-05": {
          receitas: { meuSalario: 0, salarioEsposa: 0 },
          despesasFixas: { agua: 0, luz: 0, parcelaCasa: 0, internet: 0, seguroMoto: 0, feira: 0 },
          demaisGastos: []
        }
      })
      setLoading(false)
    }
    
    carregarEstado()
  }, [])

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico }))
    }
  }, [mesAtivo, historico, loading])

  const obterDadosMesAtivo = useCallback(() => {
    if (!historico[mesAtivo]) {
      return {
        receitas: { meuSalario: 0, salarioEsposa: 0 },
        despesasFixas: { agua: 0, luz: 0, parcelaCasa: 0, internet: 0, seguroMoto: 0, feira: 0 },
        demaisGastos: []
      }
    }
    return historico[mesAtivo]
  }, [historico, mesAtivo])

  const atualizarReceita = (tipo, valor) => {
    setHistorico(prev => ({
      ...prev,
      [mesAtivo]: {
        ...prev[mesAtivo],
        receitas: { ...prev[mesAtivo]?.receitas, [tipo]: valor }
      }
    }))
  }

  const atualizarDespesaFixa = (tipo, valor) => {
    setHistorico(prev => ({
      ...prev,
      [mesAtivo]: {
        ...prev[mesAtivo],
        despesasFixas: { ...prev[mesAtivo]?.despesasFixas, [tipo]: valor }
      }
    }))
  }

  const adicionarGasto = (nome, valor) => {
    const novoGasto = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nome,
      valor
    }
    setHistorico(prev => ({
      ...prev,
      [mesAtivo]: {
        ...prev[mesAtivo],
        demaisGastos: [...(prev[mesAtivo]?.demaisGastos || []), novoGasto]
      }
    }))
  }

  const removerGasto = (id) => {
    setHistorico(prev => ({
      ...prev,
      [mesAtivo]: {
        ...prev[mesAtivo],
        demaisGastos: prev[mesAtivo]?.demaisGastos.filter(g => g.id !== id) || []
      }
    }))
  }

  const mudarMes = (novoMes) => {
    if (!historico[novoMes]) {
      setHistorico(prev => ({
        ...prev,
        [novoMes]: {
          receitas: { meuSalario: 0, salarioEsposa: 0 },
          despesasFixas: { agua: 0, luz: 0, parcelaCasa: 0, internet: 0, seguroMoto: 0, feira: 0 },
          demaisGastos: []
        }
      }))
    }
    setMesAtivo(novoMes)
  }

  const value = {
    mesAtivo,
    historico,
    loading,
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
  }

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => useContext(FinanceContext)