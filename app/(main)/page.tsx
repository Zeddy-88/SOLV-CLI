import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from '@/components/upload/HomeClient'
import RecentHistory from '@/components/history/RecentHistory'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: recent } = await supabase
    .from('analyses')
    .select('id, company_name, created_at, status')
    .eq('user_id', user.id)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="px-5 py-6">
      <HomeClient />
      {recent && recent.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            최근 분석
          </p>
          <RecentHistory analyses={recent} />
        </div>
      )}
    </div>
  )
}
