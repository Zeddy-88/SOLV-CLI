import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Solve AI — 기업 재무 분석',
  description: '법인 영업사원을 위한 AI 재무 분석 도구',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
