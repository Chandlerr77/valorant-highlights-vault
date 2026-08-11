'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Clip = {
  id: string
  title: string
  video_url: string
  tags: string
}

export default function HomePage() {
  const [clips, setClips] = useState<Clip[]>([])
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [aiFallback, setAiFallback] = useState(false)
  const [displayedClips, setDisplayedClips] = useState<Clip[] | null>(null)

  useEffect(() => {
    supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClips(data ?? []))
  }, [])

  useEffect(() => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      setDisplayedClips(null)
      setAiFallback(false)
      return
    }

    // 第一步：本地关键词精确匹配，快且100%可靠
    const lower = trimmed.toLowerCase()
    const localMatches = clips.filter(
      (c) =>
        c.title?.toLowerCase().includes(lower) || c.tags?.toLowerCase().includes(lower)
    )

    if (localMatches.length > 0) {
      setDisplayedClips(localMatches)
      setAiFallback(false)
      return
    }

    // 第二步：关键词完全没命中时，才交给 AI 做语义兜底
    setSearching(true)
    setAiFallback(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        })
        const data = await res.json()
        const ids: string[] = data.ids ?? []
        setDisplayedClips(
          ids.map((id) => clips.find((c) => c.id === id)).filter((c): c is Clip => Boolean(c))
        )
      } catch (e) {
        console.error('搜索失败', e)
        setDisplayedClips([])
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [keyword, clips])

  const visibleClips = displayedClips ?? clips

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的高光时刻</h1>
        <Link href="/upload" className="bg-black text-white px-4 py-2 rounded">
          + 上传
        </Link>
      </div>
      <input
        type="text"
        placeholder="搜索标题/描述，找不到关键词时 AI 会帮你理解意思"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      {searching && <p className="text-sm text-gray-500 mb-4">没有直接匹配，AI 语义搜索中...</p>}
      {aiFallback && !searching && displayedClips && displayedClips.length > 0 && (
        <p className="text-sm text-gray-400 mb-4">没有关键词直接匹配，以下是 AI 找到的相关视频</p>
      )}
      <div className="grid gap-4">
        {visibleClips.map((clip) => (
          <div key={clip.id} className="border rounded p-4">
            <p className="font-medium mb-2">{clip.title}</p>
            {clip.tags && <p className="text-sm text-gray-400 mb-2">{clip.tags}</p>}
            <video src={clip.video_url} controls className="w-full rounded" />
          </div>
        ))}
        {visibleClips.length === 0 && displayedClips === null && (
          <p className="text-gray-500">还没有视频，点右上角上传第一个吧</p>
        )}
        {visibleClips.length === 0 && displayedClips !== null && !searching && (
          <p className="text-gray-500">没有找到匹配的视频</p>
        )}
      </div>
    </main>
  )
}
