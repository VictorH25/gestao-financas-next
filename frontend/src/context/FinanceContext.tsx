'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { DynamicExpense, FixedCategory, MonthRecord } from '@/types'
import { formatBRL, mesAnterior, mesAtualStr, mesSeguinte, nomeMes } from '@/lib/utils'

const DEFAULT_CATEGORIES: FixedCategory[] = [
  { id: 'agua', label: 'Agua', color: 'text-blue', icon: '💧', isDefault: true },
  { id: 'luz', label: 'Luz', color: 'text-yellow', icon: '⚡', isDefault: true },
  { id: 'parcelaCasa', label: 'Parcela Casa / Aluguel', color: 'text-purple', icon: '🏠', isDefault: true },
  { id: 'internet', label: 'Internet', color: 'text-cyan', icon: '🌐', isDefault: true },
  { id: 'seguroMoto', label: 'Seguro da Moto', color: 'text-orange', icon: '🛵', isDefault: true },
  { id: 'feira', label: 'Feira / Supermercado', color: 'text-green', icon: '🛒', isDefault: true },
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
  demaisGastos: [],
})

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading: authLoading, getAuthHeaders } = useAuth()
  const [mesAtivo, setMesAtivo] = useState<string>(mesAtualStr())
  const [historico, setHistorico] = useState<Record<string, MonthRecord>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [fixedCategories, setFixedCategories] = useState<FixedCategory[]>(DEFAULT_CATEGORIES)

  const cacheCarregados = useRef<Set<string>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
  const mudancasPendentesRef = useRef<Record<string, Record<string, number>>>({})
  const ultimoPayloadEnviadoRef = useRef<Record<string, Record<string, number>>>({})

  const categoriesStorageKey = user ? `finfamilia_fixed_categories_${user.id}` : 'finfamilia_fixed_categories'

  useEffect(() => {
    queueMicrotask(() => {
      cacheCarregados.current.clear()
      setHistorico({})
      setLoading(authLoading || isAuthenticated)
    })
  }, [authLoading, isAuthenticated, user?.id])

  useEffect(() => {
    queueMicrotask(() => {
      if (!user) {
        setFixedCategories(DEFAULT_CATEGORIES)
        return
      }

      try {
        const categoriasSalvas = localStorage.getItem(categoriesStorageKey)
        if (categoriasSalvas) {
          setFixedCategories(JSON.parse(categoriasSalvas))
        } else {
          setFixedCategories(DEFAULT_CATEGORIES)
          localStorage.setItem(categoriesStorageKey, JSON.stringify(DEFAULT_CATEGORIES))
        }
      } catch (e) {
        console.error('Erro ao ler categorias do localStorage', e)
        setFixedCategories(DEFAULT_CATEGORIES)
      }
    })
  }, [categoriesStorageKey, user])

  const requestHeaders = useCallback(
    (contentType = false): HeadersInit => ({
      ...(contentType ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
    }),
    [getAuthHeaders]
  )

  const buscarDadosMes = useCallback(
    async (month: string, forcarRevalidacao = false, silent = false) => {
      if (!isAuthenticated) {
        if (!silent) setLoading(false)
        return
      }

      if (cacheCarregados.current.has(month) && !forcarRevalidacao) {
        if (!silent) setLoading(false)
        return
      }

      let controller: AbortController
      if (!silent) {
        abortControllerRef.current?.abort()
        controller = new AbortController()
        abortControllerRef.current = controller
      } else {
        controller = new AbortController()
      }
      if (!silent) setLoading(true)

      try {
        const response = await fetch(`/api/financas?month=${month}`, {
          headers: requestHeaders(),
          credentials: 'include',
          signal: controller.signal,
        })
        if (response.status === 401) {
          if (!silent) setLoading(false)
          return
        }
        if (!response.ok) throw new Error('Falha ao buscar dados')

        const data: MonthRecord = await response.json()
        setHistorico(prev => ({ ...prev, [month]: data }))
        cacheCarregados.current.add(month)
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error(`Erro ao buscar dados de ${month}`, e)
          setHistorico(prev => (prev[month] ? prev : { ...prev, [month]: criarMonthRecordVazio(month) }))
        }
      } finally {
        if (silent || abortControllerRef.current === controller) {
          if (!silent) setLoading(false)
        }
      }
    },
    [isAuthenticated, requestHeaders]
  )

  useEffect(() => {
    queueMicrotask(() => {
      buscarDadosMes(mesAtivo)
    })
  }, [mesAtivo, buscarDadosMes])

  useEffect(() => {
    queueMicrotask(() => {
      const mesPrevio = mesAnterior(mesAtivo)
      if (!cacheCarregados.current.has(mesPrevio)) {
        buscarDadosMes(mesPrevio, false, true)
      }
    })
  }, [mesAtivo, buscarDadosMes])

  const revalidarMesAtivo = useCallback(async () => {
    await buscarDadosMes(mesAtivo, true)
  }, [buscarDadosMes, mesAtivo])

  const obterDadosMesAtivo = useCallback((): MonthRecord => {
    return historico[mesAtivo] || criarMonthRecordVazio(mesAtivo)
  }, [historico, mesAtivo])

  const enviarPatchDebounced = useCallback(
    (month: string, camposAlterados: Record<string, number>) => {
      if (!isAuthenticated) return

      const registroAtual = historico[month] || criarMonthRecordVazio(month)
      const camposFiltrados: Record<string, number> = {}
      for (const [key, value] of Object.entries(camposAlterados)) {
        const valorAtual = Number((registroAtual as any)[key] ?? 0)
        if (Number(value) !== valorAtual) {
          camposFiltrados[key] = Number(value)
        }
      }
      if (Object.keys(camposFiltrados).length === 0) return

      mudancasPendentesRef.current[month] = {
        ...(mudancasPendentesRef.current[month] || {}),
        ...camposFiltrados,
      }

      if (debounceTimeoutRef.current[month]) {
        clearTimeout(debounceTimeoutRef.current[month])
      }

      debounceTimeoutRef.current[month] = setTimeout(async () => {
        const pendingChanges = { ...(mudancasPendentesRef.current[month] || {}) }
        const payload = { month, ...pendingChanges }
        mudancasPendentesRef.current[month] = {}

        const payloadSemMes: Record<string, number> = pendingChanges
        const ultimoPayload = ultimoPayloadEnviadoRef.current[month] || {}
        if (JSON.stringify(payloadSemMes) === JSON.stringify(ultimoPayload)) {
          return
        }
        ultimoPayloadEnviadoRef.current[month] = payloadSemMes

        try {
          const response = await fetch('/api/financas', {
            method: 'PATCH',
            headers: requestHeaders(true),
            credentials: 'include',
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error('Erro ao salvar campos')

          const updatedRecord: MonthRecord = await response.json()
          setHistorico(prev => ({ ...prev, [month]: updatedRecord }))
        } catch (err) {
          console.error('Falha ao salvar dados de forma debouncada:', err)
          buscarDadosMes(month, true)
        }
      }, 500)
    },
    [buscarDadosMes, historico, isAuthenticated, requestHeaders]
  )

  const atualizarReceita = (tipo: string, valor: number) => {
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const novoRegistro = {
        ...registroMes,
        meuSalario: tipo === 'meuSalario' ? valor : registroMes.meuSalario,
        salarioEsposa: tipo === 'salarioEsposa' ? valor : registroMes.salarioEsposa,
      }
      return { ...prev, [mesAtivo]: novoRegistro }
    })

    enviarPatchDebounced(mesAtivo, { [tipo]: valor })
  }

  const atualizarDespesaFixa = (tipo: string, valor: number) => {
    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      return { ...prev, [mesAtivo]: { ...registroMes, [tipo]: valor } }
    })

    enviarPatchDebounced(mesAtivo, { [tipo]: valor })
  }

  const atualizarDespesaFixaDinamica = (label: string, valor: number) => {
    const nomeGasto = `[FIXA] ${label}`

    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      const demaisGastos = registroMes.demaisGastos.filter(g => g.nome !== nomeGasto)
      const gastoExistente = registroMes.demaisGastos.find(g => g.nome === nomeGasto)
      const novoGasto: DynamicExpense = {
        id: gastoExistente?.id || `temp-${Date.now()}`,
        nome: nomeGasto,
        valor,
        monthRecordId: registroMes.id,
      }

      return { ...prev, [mesAtivo]: { ...registroMes, demaisGastos: [...demaisGastos, novoGasto] } }
    })

    const key = `custom-fixed-${label}`
    if (debounceTimeoutRef.current[key]) {
      clearTimeout(debounceTimeoutRef.current[key])
    }

    debounceTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const response = await fetch('/api/financas', {
          method: 'POST',
          headers: requestHeaders(true),
          credentials: 'include',
          body: JSON.stringify({ month: mesAtivo, nome: nomeGasto, valor }),
        })
        if (!response.ok) throw new Error('Erro ao salvar despesa dinamica')

        const updatedRecord: MonthRecord = await response.json()
        setHistorico(prev => ({ ...prev, [mesAtivo]: updatedRecord }))
      } catch (err) {
        console.error('Falha ao salvar despesa dinamica:', err)
      }
    }, 500)
  }

  const adicionarCategoriaFixa = (label: string, icon: string, color: string) => {
    const nova: FixedCategory = {
      id: `fixed-custom-${Date.now()}`,
      label,
      icon,
      color,
      isDefault: false,
    }

    setFixedCategories(prev => {
      const novas = [...prev, nova]
      localStorage.setItem(categoriesStorageKey, JSON.stringify(novas))
      return novas
    })
  }

  const removerCategoriaFixa = (id: string) => {
    const categoria = fixedCategories.find(c => c.id === id)
    if (!categoria) return

    setFixedCategories(prev => {
      const novas = prev.filter(c => c.id !== id)
      localStorage.setItem(categoriesStorageKey, JSON.stringify(novas))
      return novas
    })

    if (!categoria.isDefault) {
      const nomeGasto = `[FIXA] ${categoria.label}`
      const gastoExistente = obterDadosMesAtivo().demaisGastos.find(g => g.nome === nomeGasto)
      if (gastoExistente) removerGasto(gastoExistente.id)
    } else {
      atualizarDespesaFixa(categoria.id, 0)
    }
  }

  const restaurarCategoriasPadrao = () => {
    setFixedCategories(DEFAULT_CATEGORIES)
    localStorage.setItem(categoriesStorageKey, JSON.stringify(DEFAULT_CATEGORIES))
  }

  const adicionarGasto = async (nome: string, valor: number) => {
    const idOtimista = `temp-${Date.now()}${Math.random().toString(36).slice(2, 9)}`
    const backupHistorico = { ...historico }
    const novoGastoOtimista: DynamicExpense = {
      id: idOtimista,
      nome,
      valor,
      monthRecordId: '',
      createdAt: new Date().toISOString(),
    }

    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      return {
        ...prev,
        [mesAtivo]: {
          ...registroMes,
          demaisGastos: [...registroMes.demaisGastos, novoGastoOtimista],
        },
      }
    })

    try {
      const response = await fetch('/api/financas', {
        method: 'POST',
        headers: requestHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ month: mesAtivo, nome, valor }),
      })

      if (!response.ok) throw new Error('Erro ao adicionar gasto')
      const updatedRecord: MonthRecord = await response.json()
      setHistorico(prev => ({ ...prev, [mesAtivo]: updatedRecord }))
    } catch (err) {
      console.error('Falha ao adicionar gasto (revertendo UI):', err)
      setHistorico(backupHistorico)
      alert('Erro de conexao ao salvar gasto. A operacao foi cancelada.')
    }
  }

  const removerGasto = async (id: string) => {
    const backupHistorico = { ...historico }

    setHistorico(prev => {
      const registroMes = prev[mesAtivo] || criarMonthRecordVazio(mesAtivo)
      return {
        ...prev,
        [mesAtivo]: {
          ...registroMes,
          demaisGastos: registroMes.demaisGastos.filter(g => g.id !== id),
        },
      }
    })

    try {
      const response = await fetch(`/api/financas?id=${id}&month=${mesAtivo}`, {
        method: 'DELETE',
        headers: requestHeaders(),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao deletar gasto')
      const updatedRecord: MonthRecord = await response.json()
      setHistorico(prev => ({ ...prev, [mesAtivo]: updatedRecord }))
    } catch (err) {
      console.error('Falha ao excluir gasto (revertendo UI):', err)
      setHistorico(backupHistorico)
      alert('Erro de conexao ao excluir gasto. A operacao foi desfeita.')
    }
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
    mudarMes: setMesAtivo,
    formatarBRL: formatBRL,
    obterNomeMes: nomeMes,
    obterMesAnterior: mesAnterior,
    obterMesSeguinte: mesSeguinte,
    revalidarMesAtivo,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider')
  }
  return context
}
