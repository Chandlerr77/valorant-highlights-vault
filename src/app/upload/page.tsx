'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { VALORANT_MAPS, VALORANT_AGENTS, KILL_OPTIONS, SPECIAL_OPTIONS } from '@/lib/valorantData'

const MAX_FILE_SIZE = 49 * 1024 * 1024 // Supabase 免费版存储桶硬上限 50MB，留 1MB 余量

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [map, setMap] = useState('')
  const [agent, setAgent] = useState('')
  const [kills, setKills] = useState('')
  const [special, setSpecial] = useState<string[]>([])
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle')
  const [uploading, setUploading] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const router = useRouter()

  function resetFields() {
    setTitle('')
    setMap('')
    setAgent('')
    setKills('')
    setSpecial([])
  }

  async function handleFileChange(selected: File | null) {
    resetFields()
    setAiStatus('idle')

    if (selected && selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setSizeError(true)
      return
    }
    setSizeError(false)
    setFile(selected)

    if (!selected) return

    setAiStatus('loading')
    try {
      const { extractFrame } = await import('@/lib/extractFrame')
      const frameBlob = await extractFrame(selected)
      const form = new FormData()
      form.append('image', frameBlob, 'frame.jpg')
      const res = await fetch('/api/tag-clip', { method: 'POST', body: form })
      const data = await res.json()
      const parsed = JSON.parse(data.raw)
      setMap(VALORANT_MAPS.includes(parsed.map) ? parsed.map : '')
      setAgent(VALORANT_AGENTS.includes(parsed.agent) ? parsed.agent : '')
      setKills(KILL_OPTIONS.includes(parsed.kills) ? parsed.kills : '')
      const specialGuess: string[] = (parsed.special || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => SPECIAL_OPTIONS.includes(s))
      setSpecial(specialGuess)
      setTitle(parsed.title || '')
      setAiStatus('done')
    } catch (e) {
      console.error('AI 打标签失败，请手动填写', e)
      setAiStatus('failed')
    }
  }

  function toggleSpecial(option: string) {
    setSpecial((prev) =>
      prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]
    )
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
      map,
      agent,
      kills,
      special,
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
      <p className="text-sm text-gray-500 mb-2">视频文件最大 49MB</p>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        className="mb-4"
      />

      {sizeError && (
        <p className="text-sm text-red-500 mb-4">
          这个文件超过 49MB 了，换一个小一点的片段，或者用剪辑软件先压缩一下
        </p>
      )}
      {aiStatus === 'loading' && (
        <p className="text-sm text-gray-500 mb-4">AI 识别中，请稍候...</p>
      )}
      {aiStatus === 'failed' && (
        <p className="text-sm text-red-500 mb-4">AI 识别失败，请手动选择</p>
      )}

      <input
        type="text"
        placeholder="标题（AI 识别后会自动填，也可以手动改）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">地图</label>
          <select
            value={map}
            onChange={(e) => setMap(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">未识别</option>
            {VALORANT_MAPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">英雄</label>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">未识别</option>
            {VALORANT_AGENTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-500 mb-1">击杀数</label>
        <select
          value={kills}
          onChange={(e) => setKills(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">无</option>
          {KILL_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-500 mb-1">特殊标签</label>
        <div className="flex gap-4">
          {SPECIAL_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={special.includes(option)}
                onChange={() => toggleSpecial(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

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
