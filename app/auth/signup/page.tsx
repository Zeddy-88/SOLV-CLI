'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 이메일 확인이 비활성화된 경우 세션이 바로 생성됨
    if (data.session) {
      router.push('/')
      router.refresh()
      return
    }

    // 이메일 확인이 필요한 경우
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-full flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">확인 이메일을 보냈습니다</h2>
          <p className="text-sm text-gray-500 mb-4">
            {email}으로 전송된 링크를 클릭하여 가입을 완료해주세요.
          </p>
          <Link href="/auth/login" className="text-blue-700 hover:underline text-sm font-medium">
            로그인 화면으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Solve AI</h1>
          <p className="mt-1 text-sm text-gray-500">새 계정 만들기</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="6자 이상"
            />
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              id="password-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-700 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-700 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
