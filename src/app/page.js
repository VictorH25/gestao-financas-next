// src/app/page.js
'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [month, setMonth] = useState('2026-05')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    setLoading(true)
    const res = await fetch(`/api/financas?month=${month}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  async function updateField(field, value) {
    const res = await fetch('/api/financas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, [field]: parseFloat(value) || 0 })
    })
    const json = await res.json()
    setData(json)
  }

  async function addExpense(nome, valor) {
    const res = await fetch('/api/financas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, nome, valor: parseFloat(valor) })
    })
    const json = await res.json()
    setData(json)
  }

  async function deleteExpense(id) {
    const res = await fetch(`/api/financas?id=${id}&month=${month}`, {
      method: 'DELETE'
    })
    const json = await res.json()
    setData(json)
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestão de Finanças</h1>

      <div className="mb-4">
        <label className="font-semibold">Mês: </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded px-2 py-1 ml-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Receitas</h2>
          <div>
            <label>Meu Salário: </label>
            <input
              type="number"
              defaultValue={data?.meuSalario || 0}
              onBlur={(e) => updateField('meuSalario', e.target.value)}
              className="border rounded px-2 py-1 ml-2 w-32"
            />
          </div>
          <div className="mt-2">
            <label>Salário Esposa: </label>
            <input
              type="number"
              defaultValue={data?.salarioEsposa || 0}
              onBlur={(e) => updateField('salarioEsposa', e.target.value)}
              className="border rounded px-2 py-1 ml-2 w-32"
            />
          </div>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Despesas Fixas</h2>
          {['agua', 'luz', 'parcelaCasa', 'internet', 'seguroMoto', 'feira'].map(field => (
            <div key={field}>
              <label className="capitalize">{field}: </label>
              <input
                type="number"
                defaultValue={data?.[field] || 0}
                onBlur={(e) => updateField(field, e.target.value)}
                className="border rounded px-2 py-1 ml-2 w-32"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Demais Gastos</h2>
        <div className="mb-4">
          <form onSubmit={(e) => {
            e.preventDefault()
            const nome = e.target.nome.value
            const valor = e.target.valor.value
            if (nome && valor) addExpense(nome, valor)
            e.target.reset()
          }} className="flex gap-2">
            <input name="nome" placeholder="Nome do gasto" className="border rounded px-2 py-1 flex-1" />
            <input name="valor" type="number" placeholder="Valor" className="border rounded px-2 py-1 w-32" />
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">Adicionar</button>
          </form>
        </div>

        <div className="space-y-2">
          {data?.demaisGastos?.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center border-b py-1">
              <span>{gasto.nome}</span>
              <span>R$ {gasto.valor.toFixed(2)}</span>
              <button
                onClick={() => deleteExpense(gasto.id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Resumo</h3>
        <p>Total Receitas: R$ {(data?.meuSalario || 0) + (data?.salarioEsposa || 0)}</p>
        <p>Total Despesas: R$ {Object.values(data || {}).reduce((acc, val) => {
          const fixedTotal = (data?.agua || 0) + (data?.luz || 0) + (data?.parcelaCasa || 0) +
            (data?.internet || 0) + (data?.seguroMoto || 0) + (data?.feira || 0)
          const dynamicTotal = data?.demaisGastos?.reduce((s, g) => s + g.valor, 0) || 0
          return fixedTotal + dynamicTotal
        }, 0)}</p>
      </div>
    </div>
  )
}