'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AnalysisStatus } from '@/types/analysis'

export function useAnalysisStatus(analysisId: string) {
  const [status, setStatus] = useState<AnalysisStatus>('pending')

  useEffect(() => {
    const supabase = createClient()

    // 초기 상태 조회
    supabase
      .from('analyses')
      .select('status')
      .eq('id', analysisId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as AnalysisStatus)
      })

    // Realtime 구독
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          setStatus((payload.new as { status: AnalysisStatus }).status)
        }
      )
      .subscribe()

    // Realtime 실패 시 폴백: 5초 간격 폴링
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('analyses')
        .select('status')
        .eq('id', analysisId)
        .single()
      if (data) setStatus(data.status as AnalysisStatus)
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [analysisId])

  return status
}
