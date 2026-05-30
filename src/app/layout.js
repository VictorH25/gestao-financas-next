// src/app/layout.js
import { FinanceProvider } from '@/context/FinanceContext'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
})

export const metadata = {
  title: 'FinFamília - Gestão de Finanças Pessoais e Familiares',
  description: 'Controle completo das finanças pessoais e familiares',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body suppressHydrationWarning className={plusJakartaSans.className}>
        <FinanceProvider>
          {children}
        </FinanceProvider>
      </body>
    </html>
  )
}