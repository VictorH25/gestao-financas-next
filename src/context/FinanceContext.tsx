// src/context/FinanceContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { MonthRecord, DynamicExpense, FixedCategory } from '@/types'
import { mesAtualStr, mesAnterior, mesSeguinte, nomeMes, formatBRL } from '@/lib/utils'

const DEFAULT_CATEGORIES: FixedCategory[] = [
  { id: 'agua',        label: 'Água',                   color: 'text-blue',   icon: '💧', isDefault: true },
  { id: 'luz',         label: 'Luz',                    color: 'text-yellow', icon: '⚡', isDefault: true },
  { id: 'parcelaCasa', label: 'Parcela Casa / Aluguel', color: 'text-purple', icon: '🏠', isDefault: true },
  { id: 'internet',    label: 'Internet',               color: 'text-cyan',   icon: '🌐', isDefault: true },
  { id: 'seguroMoto',  label: 'Seguro da Moto',         color: 'text-orange', icon: '🛵', isDefault: true },
  { id: 'feira',       label: 'Feira / Supermercado',   color: 'text-green',  icon: '🛒', isDefault: true },
]

interface FinanceContextType {
  mesAtivo: string
  historico: Record<string, MonthRecord>
  loading: boolean
  fixedCategories: FixedCategory[]
  obterDadosMesAtivo: () => MonthRecord
  atualizarReceita: (tipo: string, valor: number) => void
  atualizarDespesaFixa: (tipo: string, valor: number) => void
  atualizarDespesaFixaDinamica: (label: string, valor: number) => void
  adicionarCategoriaFixa: (label: string, icon: string, color: string) => void
  removerCategoriaFixa: (id: string) => void
  restaurarCategoriasPadrao: () => void
  adicionarGasto: (nome: string, valor: number) => Promise<void>
  removerGasto: (id: string) => Promise<void>
  mudarMes: (novoMes: string) => void
  formatarBRL: (valor: number) => string
  obterNomeMes: (mesAnoStr: string) => string
  obterMesAnterior: (mesAnoStr: string) => string
  obterMesSeguinte: (mesAnoStr: string) => string
  revalidarMesAtivo: () => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

const criarMonthRecordVazio = (month: string): MonthRecord => ({
  id: '',
  month,
  meuSalario: 0,
  salarioEsposa: 0,
  agua: 0,
  luz: 0,
  parcelaCasa: 0,
  internet: 0,
  seguroMoto: 0,
  feira: 0,
  demaisGastos: []
})

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [mesAtivo, setMesAtivo] = useState<string>("2026-05")
  const [historico, setHistorico] = useState<Record<string, MonthRecord>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [fixedCategories, setFixedCategories] = useState<FixedCategory[]>([])

  // Cache em memória para evitar requisições redundantes de meses já carregados
  const cacheCarregados = useRef<Set<string>>(new Set())
  
  // Referências para controle de requisições ativas (evitar condições de corrida)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Referências para debouncing de patches (salvamento de receitas e despesas fixas)
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
  const mudancasPendentesRef = useRef<Record<string, Record<string, number>>>({})

  // 1. Carregar estado inicial rápido do localStorage (Stale-While-Revalidate)
  useEffect(() => {
    const carregarLocalStorage = () => {
      try {
        const salvo = localStorage.getItem('finfamilia_estado_v2')
        if (salvo) {
          const parsed = JSON.parse(salvo)
          if (parsed.historico && parsed.mesAtivo) {
            setHistorico(parsed.historico)
            setMesAtivo(parsed.mesAtivo)
            // Marcar todos os meses restaurados do localStorage como carregados inicialmente
            Object.keys(parsed.historico).forEach(m => cacheCarregados.current.add(m))
          }
        }

        const categoriasSalvas = localStorage.getItem('finfamilia_fixed_categories')
        if (categoriasSalvas) {
          setFixedCategories(JSON.parse(categoriasSalvas))
        } else {
          setFixedCategories(DEFAULT_CATEGORIES)
          localStorage.setItem('finfamilia_fixed_categories', JSON.stringify(DEFAULT_CATEGORIES))
        }
      } catch (e) {
        console.error("Erro ao ler localStorage", e)
        setFixedCategories(DEFAULT_CATEGORIES)
      }
    }
    carregarLocalStorage()
  }, [])

  // Buscar dados da API para o mês ativo
  const buscarDadosMes = useCallback(async (month: string, forcarRevalidacao = false) => {
    // Se já estiver no cache e não for revalidação forçada, não faz nada
    if (cacheCarregados.current.has(month) && !forcarRevalidacao) {
      setLoading(false)
      return
    }

    // Cancelar requisição anterior se houver (AbortController)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    setLoading(true)

    try {
      const response = await fetch(`/api/financas?month=${month}`, {
        signal: controller.signal
      })
      if (!response.ok) throw new Error('Falha ao buscar dados')
      const data: MonthRecord = await response.json()

      setHistorico(prev => {
        const novoHistorico = {
          ...prev,
          [month]: data
        }
        // Sincronizar cache no localStorage
        localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ 
          mesAtivo: month, 
          historico: novoHistorico 
        }))
        return novoHistorico
      })

      cacheCarregados.current.add(month)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(`Erro ao buscar dados de ${month}`, e)
        // Se falhar e não tivermos dados no estado local, criamos um registro vazio temporário
        setHistorico(prev => {
          if (prev[month]) return prev
          return {
            ...prev,
            [month]: criarMonthRecordVazio(month)
          }
        })
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [])

  // Disparar busca ao alterar o mês ativo
  useEffect(() => {
    buscarDadosMes(mesAtivo)
  }, [mesAtivo, buscarDadosMes])

  // Função para forçar revalidação
  const revalidarMesAtivo = useCallback(async () => {
    await buscarDadosMes(mesAtivo, true)
  }, [mesAtivo, buscarDadosMes])

  // Obter dados do mês ativo de forma segura
  const obterDadosMesAtivo = useCallback((): MonthRecord => {
    return historico[mesAtivo] || criarMonthRecordVazio(mesAtivo)
  }, [historico, mesAtivo])

  // Enviar alterações via PATCH de forma debouncada por campo/mês
  const enviarPatchDebounced = (month: string, camposAlterados: Record<string, number>) => {
    // Mesclar com alterações que já estavam pendentes para este mês
    if (!mudancasPendentesRef.current[month]) {
      mudancasPendentesRef.current[month] = {}
    }
    mudancasPendentesRef.current[month] = {
      ...mudancasPendentesRef.current[month],
      ...camposAlterados
    }

    // Cancelar timeout existente se houver
    if (debounceTimeoutRef.current[month]) {
      clearTimeout(debounceTimeoutRef.current[month])
    }

    // Agendar requisição PATCH para 500ms
    debounceTimeoutRef.current[month] = setTimeout(async () => {
      const payload = {
        month,
        ...mudancasPendentesRef.current[month]
      }
      
      // Limpar pendências antes da requisição para não engolir alterações no meio tempo
      mudancasPendentesRef.current[month] = {}

      try {
        const response = await fetch('/api/financas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error('Erro ao salvar campos')
        const updatedRecord: MonthRecord = await response.json()
        
        // Atualizar estado com os dados finais retornados do servidor
        setHistorico(prev => {
          const novoHistorico = { ...prev, [month]: updatedRecord }
          localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ 
            mesAtivo: month, 
            historico: novoHistorico 
          }))
          return novoHistorico
        })
      } catch (err) {
        console.error('Falha ao salvar dados de forma debouncada:', err)
        // Se der erro, revalidamos com o banco de dados para garantir consistência
        buscarDadosMes(month, true)
      }
    }, 500)
  }

  // Atualizar receita localmente instantâneo (UX excelente) e enviar patch debouncado
  const atualizarReceita = (tipo: string, valor: number) => {
    // 1. Atualiza o estado da tela imediatamente
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const novoRegistro = {
        ...registroMes,
        meuSalario: tipo === 'meuSalario' ? valor : registroMes.meuSalario,
        salarioEsposa: tipo === 'salarioEsposa' ? valor : registroMes.salarioEsposa
      }
      const novoHistorico = { ...prev, [mesAtivo]: novoRegistro }
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
      return novoHistorico
    })

    // 2. Envia para o banco de dados de forma debouncada
    enviarPatchDebounced(mesAtivo, { [tipo]: valor })
  }

  // Atualizar despesa fixa localmente instantâneo e enviar patch debouncado
  const atualizarDespesaFixa = (tipo: string, valor: number) => {
    // 1. Atualiza o estado da tela imediatamente
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const novoRegistro = {
        ...registroMes,
        [tipo]: valor
      }
      const novoHistorico = { ...prev, [mesAtivo]: novoRegistro }
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
      return novoHistorico
    })

    // 2. Envia para o banco de dados de forma debouncada
    enviarPatchDebounced(mesAtivo, { [tipo]: valor })
  }

  // Atualizar despesa fixa dinâmica localmente instantâneo e enviar POST debouncado
  const atualizarDespesaFixaDinamica = (label: string, valor: number) => {
    const nomeGasto = `[FIXA] ${label}`
    
    // 1. Atualizar o estado da tela imediatamente
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const outrosGastos = registroMes.demaisGastos.filter(g => g.nome !== nomeGasto)
      
      const gastoExistente = registroMes.demaisGastos.find(g => g.nome === nomeGasto)
      const novoGasto: DynamicExpense = {
        id: gastoExistente?.id || 'temp-' + Date.now(),
        nome: nomeGasto,
        valor,
        monthRecordId: registroMes.id
      }
      
      const novoRegistro = {
        ...registroMes,
        demaisGastos: [...outrosGastos, novoGasto]
      }
      const novoHistorico = { ...prev, [mesAtivo]: novoRegistro }
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
      return novoHistorico
    })

    // 2. Envia para o banco de dados de forma debouncada (via POST que faz upsert)
    const key = `custom-fixed-${label}`
    if (debounceTimeoutRef.current[key]) {
      clearTimeout(debounceTimeoutRef.current[key])
    }

    debounceTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const response = await fetch('/api/financas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: mesAtivo, nome: nomeGasto, valor })
        })
        if (!response.ok) throw new Error('Erro ao salvar despesa dinâmica')
        const updatedRecord: MonthRecord = await response.json()
        
        setHistorico(prev => {
          const novoHistorico = { ...prev, [mesAtivo]: updatedRecord }
          localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
          return novoHistorico
        })
      } catch (err) {
        console.error('Falha ao salvar despesa dinâmica:', err)
      }
    }, 500)
  }

  const adicionarCategoriaFixa = (label: string, icon: string, color: string) => {
    const nova: FixedCategory = {
      id: 'fixed-custom-' + Date.now(),
      label,
      icon,
      color,
      isDefault: false
    }
    setFixedCategories(prev => {
      const novas = [...prev, nova]
      localStorage.setItem('finfamilia_fixed_categories', JSON.stringify(novas))
      return novas
    })
  }

  const removerCategoriaFixa = (id: string) => {
    const categoria = fixedCategories.find(c => c.id === id)
    if (!categoria) return

    setFixedCategories(prev => {
      const novas = prev.filter(c => c.id !== id)
      localStorage.setItem('finfamilia_fixed_categories', JSON.stringify(novas))
      return novas
    })

    // Se for customizada, removemos o gasto associado da tela e do banco
    if (!categoria.isDefault) {
      const nomeGasto = `[FIXA] ${categoria.label}`
      const registroMes = obterDadosMesAtivo()
      const gastoExistente = registroMes.demaisGastos.find(g => g.nome === nomeGasto)
      if (gastoExistente) {
        removerGasto(gastoExistente.id)
      }
    } else {
      // Se for padrão, limpamos o valor dela na tabela
      atualizarDespesaFixa(categoria.id, 0)
    }
  }

  const restaurarCategoriasPadrao = () => {
    setFixedCategories(DEFAULT_CATEGORIES)
    localStorage.setItem('finfamilia_fixed_categories', JSON.stringify(DEFAULT_CATEGORIES))
  }

  // Adicionar gasto dinâmico com Atualização Otimista (Optimistic UI)
  const adicionarGasto = async (nome: string, valor: number) => {
    const idOtimista = 'temp-' + Date.now() + Math.random().toString(36).substr(2, 9)
    const backupHistorico = { ...historico }

    const novoGastoOtimista: DynamicExpense = {
      id: idOtimista,
      nome,
      valor,
      monthRecordId: '',
      createdAt: new Date().toISOString()
    }

    // 1. Atualização Otimista: renderizar imediatamente
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const novoRegistro = {
        ...registroMes,
        demaisGastos: [...registroMes.demaisGastos, novoGastoOtimista]
      }
      const novoHistorico = { ...prev, [mesAtivo]: novoRegistro }
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
      return novoHistorico
    })

    try {
      // 2. Executar requisição de rede em background
      const response = await fetch('/api/financas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: mesAtivo, nome, valor })
      })

      if (!response.ok) throw new Error('Erro ao adicionar gasto')
      const updatedRecord: MonthRecord = await response.json()

      // 3. Atualizar com dados consolidados do servidor
      setHistorico(prev => {
        const novoHistorico = { ...prev, [mesAtivo]: updatedRecord }
        localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
        return novoHistorico
      })
    } catch (err) {
      console.error('Falha ao adicionar gasto (revertendo UI):', err)
      // 4. Reverter estado em caso de falha de rede
      setHistorico(backupHistorico)
      alert('Erro de conexão ao salvar gasto. A operação foi cancelada.')
    }
  }

  // Remover gasto dinâmico com Atualização Otimista (Optimistic UI)
  const removerGasto = async (id: string) => {
    const backupHistorico = { ...historico }

    // 1. Atualização Otimista: remover imediatamente da tela
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const novoRegistro = {
        ...registroMes,
        demaisGastos: registroMes.demaisGastos.filter(g => g.id !== id)
      }
      const novoHistorico = { ...prev, [mesAtivo]: novoRegistro }
      localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
      return novoHistorico
    })

    try {
      // 2. Executar requisição em background
      const response = await fetch(`/api/financas?id=${id}&month=${mesAtivo}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar gasto')
      const updatedRecord: MonthRecord = await response.json()

      // 3. Atualizar com os dados finais retornados do servidor
      setHistorico(prev => {
        const novoHistorico = { ...prev, [mesAtivo]: updatedRecord }
        localStorage.setItem('finfamilia_estado_v2', JSON.stringify({ mesAtivo, historico: novoHistorico }))
        return novoHistorico
      })
    } catch (err) {
      console.error('Falha ao excluir gasto (revertendo UI):', err)
      // 4. Reverter em caso de falha
      setHistorico(backupHistorico)
      alert('Erro de conexão ao excluir gasto. A operação foi desfeita.')
    }
  }

  // Mudar de mês ativo
  const mudarMes = (novoMes: string) => {
    setMesAtivo(novoMes)
  }

  const value: FinanceContextType = {
    mesAtivo,
    historico,
    loading,
    fixedCategories,
    obterDadosMesAtivo,
    atualizarReceita,
    atualizarDespesaFixa,
    atualizarDespesaFixaDinamica,
    adicionarCategoriaFixa,
    removerCategoriaFixa,
    restaurarCategoriasPadrao,
    adicionarGasto,
    removerGasto,
    mudarMes,
    formatarBRL: formatBRL,
    obterNomeMes: nomeMes,
    obterMesAnterior: mesAnterior,
    obterMesSeguinte: mesSeguinte,
    revalidarMesAtivo
  }

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider')
  }
  return context
}
