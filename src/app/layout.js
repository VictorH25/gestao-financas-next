// src/app/layout.js
import { FinanceProvider } from '@/context/FinanceContext'
import './globals.css'

export const metadata = {
  title: 'FinFamília - Gestão de Finanças Pessoais e Familiares',
  description: 'Controle completo das finanças pessoais e familiares',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <FinanceProvider>
          {children}
        </FinanceProvider>
      </body>
    </html>
  )
}