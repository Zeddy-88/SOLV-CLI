'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navLinks = [
    { href: '/', label: '재무 분석' },
    { href: '/history', label: '분석 이력' },
  ]

  return (
    <aside className="w-56 h-screen flex flex-col bg-white border-r border-gray-200 shrink-0">
      <div className="px-5 py-4 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-900">Solve AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
