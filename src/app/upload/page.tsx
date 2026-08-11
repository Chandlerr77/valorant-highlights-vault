'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

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
        type="text"
        placeholder="给这个片段起个名字（可选）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? '上传中...' : '上传'}
      </button>
    </main>
  )
}
