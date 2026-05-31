// src/app/layout.tsx
import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { FinanceProvider } from '@/context/FinanceContext'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Metadata } from 'next'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FinFamily - Gestão de Finanças Pessoais e Familiares',
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

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body suppressHydrationWarning className={plusJakartaSans.className}>
        <AuthProvider>
          <FinanceProvider>
            {children}
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
