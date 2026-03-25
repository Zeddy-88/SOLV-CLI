'use client'

import { useState, useRef, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function UploadZone() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf') return 'PDF 파일만 업로드 가능합니다.'
    if (file.size > 20 * 1024 * 1024) return '파일 크기는 20MB 이하여야 합니다.'
    return null
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file)
    if (error) {
      setErrorMessage(error)
      setSelectedFile(null)
      return
    }
    setErrorMessage('')
    setSelectedFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return

    setState('uploading')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json() as { analysisId?: string; error?: string }

    if (!res.ok || !data.analysisId) {
      setState('error')
      setErrorMessage(data.error ?? '업로드에 실패했습니다. 다시 시도해주세요.')
      return
    }

    router.push(`/dashboard/${data.analysisId}`)
  }

  if (state === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-700">파일 업로드 중...</p>
        <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-8 py-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {selectedFile ? (
          <div>
            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
            </p>
            <p className="text-xs text-blue-700 mt-2">다른 파일을 선택하려면 클릭하세요</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700">
              PDF 파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="text-xs text-gray-400 mt-2">최대 20MB · CRETOP, NICE BizLine 포맷 지원</p>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile}
        className="mt-4 w-full bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        분석 시작
      </button>
    </div>
  )
}
