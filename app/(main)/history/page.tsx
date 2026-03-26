import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryList from '@/components/history/HistoryList'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, company_name, created_at, status, pdf_format')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium mb-4">분석 이력</h1>
      <HistoryList analyses={analyses ?? []} />
    </div>
  )
}
