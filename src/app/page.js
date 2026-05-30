// src/app/page.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import MonthSelector from '@/components/MonthSelector'
import DashboardCards from '@/components/DashboardCards'
import IncomeAndFixedExpenses from '@/components/IncomeAndFixedExpenses'
import DynamicExpenses from '@/components/DynamicExpenses'
import MoMFeedback from '@/components/MoMFeedback'
import { mesAtualStr } from '@/lib/utils'

export default function Home() {
  const [month, setMonth] = useState(mesAtualStr())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previousData, setPreviousData] = useState(null)

  // Buscar dados do mês atual
  const fetchData = useCallback(async (monthToFetch) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/financas?month=${monthToFetch}`)
      const json = await res.json()
      setData(json)
      
      // Buscar dados do mês anterior para comparação
      const [ano, mes] = monthToFetch.split('-')
      let mesAnterior = parseInt(mes) - 1
      let anoAnterior = parseInt(ano)
      if (mesAnterior === 0) {
        mesAnterior = 12
        anoAnterior--
      }
      const previousMonthStr = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}`
      
      const prevRes = await fetch(`/api/financas?month=${previousMonthStr}`)
      const prevJson = await prevRes.json()
      setPreviousData(prevJson)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(month)
  }, [month, fetchData])

  // Atualizar campo específico
  const handleFieldChange = useCallback(async (field, value) => {
    if (!data) return
    
    const updated = { ...data, [field]: value }
    setData(updated)
    
    try {
      const res = await fetch('/api/financas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, [field]: value })
      })
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
    }
  }, [month, data])

  // Adicionar gasto dinâmico
  const handleAddExpense = useCallback(async (nome, valor) => {
    try {
      const res = await fetch('/api/financas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, nome, valor })
      })
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao adicionar gasto:', error)
    }
  }, [month])

  // Deletar gasto dinâmico
  const handleDeleteExpense = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/financas?id=${id}&month=${month}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao deletar gasto:', error)
    }
  }, [month])

  // Calcular totais
  const totalReceitas = (data?.meuSalario || 0) + (data?.salarioEsposa || 0)
  const fixedExpenses = (data?.agua || 0) + (data?.luz || 0) + (data?.parcelaCasa || 0) + 
                        (data?.internet || 0) + (data?.seguroMoto || 0) + (data?.feira || 0)
  const dynamicExpenses = data?.demaisGastos?.reduce((sum, g) => sum + g.valor, 0) || 0
  const totalDespesas = fixedExpenses + dynamicExpenses
  const saldo = totalReceitas - totalDespesas
  const percentual = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              FinFamília
            </h1>
            <p className="text-white/40 text-sm mt-1">Gestão de Finanças Pessoais e Familiares</p>
          </div>
          <MonthSelector activeMonth={month} onChange={setMonth} />
        </div>

        {/* Dashboard Cards */}
        <DashboardCards 
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          saldo={saldo}
          percentual={percentual}
        />

        {/* Income and Fixed Expenses */}
        <div className="mt-6">
          <IncomeAndFixedExpenses 
            data={data || {}} 
            onFieldChange={handleFieldChange}
          />
        </div>

        {/* Dynamic Expenses */}
        <div className="mt-6">
          <DynamicExpenses 
            items={data?.demaisGastos || []}
            onAdd={handleAddExpense}
            onDelete={handleDeleteExpense}
          />
        </div>

        {/* Month-over-Month Feedback */}
        <div className="mt-6">
          <MoMFeedback 
            current={data}
            previous={previousData}
          />
        </div>
      </div>
    </div>
  )
}