import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'FinFamília - Gestão de Finanças Pessoais e Familiares',
  description: 'Controle completo das finanças pessoais e familiares com histórico mensal, análise comparativa e conselheiro inteligente.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
