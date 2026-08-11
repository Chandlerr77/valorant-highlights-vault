'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { VALORANT_MAPS, VALORANT_AGENTS, KILL_OPTIONS, SPECIAL_OPTIONS } from '@/lib/valorantData'

type Clip = {
  id: string
  title: string
  video_url: string
  map: string | null
  agent: string | null
  kills: string | null
  special: string[] | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const selectClass =
  'bg-[#0b0c0a] border border-[#262626] rounded-sm px-3 py-2 text-sm text-[#e5e5e5] focus:outline-none focus:border-[#e5e5e5]'

export default function HomePage() {
  const [clips, setClips] = useState<Clip[]>([])
  const [mapFilter, setMapFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [killsFilter, setKillsFilter] = useState('')
  const [specialFilter, setSpecialFilter] = useState('')

  useEffect(() => {
    supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClips(data ?? []))
  }, [])

  const filteredClips = clips.filter((c) => {
    if (mapFilter && c.map !== mapFilter) return false
    if (agentFilter && c.agent !== agentFilter) return false
    if (killsFilter && c.kills !== killsFilter) return false
    if (specialFilter && !(c.special ?? []).includes(specialFilter)) return false
    return true
  })

  async function handleDelete(clip: Clip) {
    if (!confirm(`确定要删除"${clip.title}"这个视频吗？删除后无法恢复。`)) return

    const storagePath = clip.video_url.split('/public/clips/')[1]
    if (storagePath) {
      await supabase.storage.from('clips').remove([storagePath])
    }

    const { error } = await supabase.from('clips').delete().eq('id', clip.id)
    if (error) {
      alert('删除失败：' + error.message)
      return
    }

    setClips((prev) => prev.filter((c) => c.id !== clip.id))
  }

  async function handleShare(clip: Clip) {
    const slug = clip.id
    const { error } = await supabase.from('clips').update({ share_slug: slug }).eq('id', clip.id)
    if (error) {
      alert('生成分享链接失败：' + error.message)
      return
    }
    const url = `${window.location.origin}/share/${slug}`
    await navigator.clipboard.writeText(url)
    alert('分享链接已复制：' + url)
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 sm:px-10">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold tracking-tight">高光存档</h1>
        <Link
          href="/upload"
          className="border border-[#e5e5e5] px-4 py-2 text-sm hover:bg-[#e5e5e5] hover:text-black transition-colors"
        >
          + 上传
        </Link>
      </div>
      <p className="text-sm text-[#8a8a8a] mb-8">
        私人存放的《无畏契约》游戏高光片段，可按地图/英雄/击杀数筛选，也可以生成私密链接分享给朋友
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <select value={mapFilter} onChange={(e) => setMapFilter(e.target.value)} className={selectClass}>
          <option value="">全部地图</option>
          {VALORANT_MAPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectClass}>
          <option value="">全部英雄</option>
          {VALORANT_AGENTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={killsFilter} onChange={(e) => setKillsFilter(e.target.value)} className={selectClass}>
          <option value="">全部击杀数</option>
          {KILL_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select value={specialFilter} onChange={(e) => setSpecialFilter(e.target.value)} className={selectClass}>
          <option value="">全部特殊标签</option>
          {SPECIAL_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-6">
        {filteredClips.map((clip) => (
          <div key={clip.id} className="border border-[#262626] bg-[#0b0c0a] p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="font-bold">{clip.title}</p>
              <div className="flex gap-4 shrink-0 ml-3 text-sm">
                <button onClick={() => handleShare(clip)} className="text-[#e5e5e5] hover:underline">
                  分享
                </button>
                <button onClick={() => handleDelete(clip)} className="text-[#ff3b30] hover:underline">
                  删除
                </button>
              </div>
            </div>
            {(clip.map || clip.agent || clip.kills || (clip.special ?? []).length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3 text-xs tabular-nums">
                {[clip.map, clip.agent, ...(clip.special ?? [])].filter(Boolean).map((tag, i) => (
                  <span key={i} className="border-l-2 border-[#8a8a8a] pl-2 text-[#8a8a8a]">
                    {tag}
                  </span>
                ))}
                {clip.kills && (
                  <span className="border-l-2 border-[#ff3b30] pl-2 text-[#ff3b30]">
                    {clip.kills}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-[#8a8a8a] mb-3 tabular-nums">{formatDate(clip.created_at)}</p>
            <video src={clip.video_url} controls className="w-full" />
          </div>
        ))}
        {filteredClips.length === 0 && clips.length === 0 && (
          <p className="text-[#8a8a8a] text-sm">还没有视频，点右上角上传第一个吧</p>
        )}
        {filteredClips.length === 0 && clips.length > 0 && (
          <p className="text-[#8a8a8a] text-sm">没有符合筛选条件的视频</p>
        )}
      </div>
    </main>
  )
}
