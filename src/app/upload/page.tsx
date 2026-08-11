'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleFileChange(selected: File | null) {
    setFile(selected)
    setTitle('')
    setTags('')
    if (!selected) {
      setAiStatus('idle')
      return
    }

    setAiStatus('loading')
    try {
      const { extractFrame } = await import('@/lib/extractFrame')
      const frameBlob = await extractFrame(selected)
      const form = new FormData()
      form.append('image', frameBlob, 'frame.jpg')
      const res = await fetch('/api/tag-clip', { method: 'POST', body: form })
      const data = await res.json()
      const parsed = JSON.parse(data.raw)
      const tagParts = [parsed.agent, parsed.map, parsed.kills].filter(Boolean)
      setTags(tagParts.join(' · '))
      setTitle(parsed.title || '')
      setAiStatus('done')
    } catch (e) {
      console.error('AI 打标签失败，请手动填写', e)
      setAiStatus('failed')
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('clips')
      .upload(fileName, file)

    if (uploadError) {
      alert('上传失败：' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName)

    const { error: insertError } = await supabase.from('clips').insert({
      title: title || file.name,
      video_url: publicUrlData.publicUrl,
      tags,
    })

    if (insertError) {
      alert('保存记录失败：' + insertError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    router.push('/')
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">上传高光视频</h1>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        className="mb-4"
      />

      {aiStatus === 'loading' && (
        <p className="text-sm text-gray-500 mb-4">AI 识别中，请稍候...</p>
      )}
      {aiStatus === 'failed' && (
        <p className="text-sm text-red-500 mb-4">AI 识别失败，请手动填写标题和标签</p>
      )}

      <input
        type="text"
        placeholder="标题（AI 识别后会自动填，也可以手动改）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      <input
        type="text"
        placeholder="标签，比如 角色 · 地图 · 三杀（AI 识别后会自动填，也可以手动改）"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading || aiStatus === 'loading'}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? '上传中...' : '上传'}
      </button>
    </main>
  )
}
