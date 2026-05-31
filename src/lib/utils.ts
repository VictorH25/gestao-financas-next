// Utilitário global para formatar em BRL
export const formatBRL = (v: number | undefined | null): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

// Nomes dos meses em português
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

export const nomeMes = (mesAno: string): string => {
  const [ano, mes] = mesAno.split('-').map(Number)
  return `${MESES[mes - 1]} de ${ano}`
}

export const mesAnterior = (mesAno: string): string => {
  const [ano, mes] = mesAno.split('-').map(Number)
  const prev = mes === 1 ? { a: ano - 1, m: 12 } : { a: ano, m: mes - 1 }
  return `${prev.a}-${String(prev.m).padStart(2, '0')}`
}

export const mesSeguinte = (mesAno: string): string => {
  const [ano, mes] = mesAno.split('-').map(Number)
  const next = mes === 12 ? { a: ano + 1, m: 1 } : { a: ano, m: mes + 1 }
  return `${next.a}-${String(next.m).padStart(2, '0')}`
}

export const mesAtualStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
