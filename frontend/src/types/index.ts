export interface DynamicExpense {
  id: string
  nome: string
  valor: number
  monthRecordId: string
  createdAt?: string | Date
}

export interface Receitas {
  meuSalario: number
  salarioEsposa: number
}

export interface DespesasFixas {
  agua: number
  luz: number
  parcelaCasa: number
  internet: number
  seguroMoto: number
  feira: number
}

export interface MonthRecord {
  id: string
  month: string
  meuSalario: number
  salarioEsposa: number
  agua: number
  luz: number
  parcelaCasa: number
  internet: number
  seguroMoto: number
  feira: number
  demaisGastos: DynamicExpense[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface FixedCategory {
  id: string
  label: string
  color: string
  icon: string
  isDefault?: boolean
}
