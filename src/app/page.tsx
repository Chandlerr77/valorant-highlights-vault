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
}

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

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的高光时刻</h1>
        <Link href="/upload" className="bg-black text-white px-4 py-2 rounded">
          + 上传
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <select
          value={mapFilter}
          onChange={(e) => setMapFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">全部地图</option>
          {VALORANT_MAPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">全部英雄</option>
          {VALORANT_AGENTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={killsFilter}
          onChange={(e) => setKillsFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">全部击杀数</option>
          {KILL_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select
          value={specialFilter}
          onChange={(e) => setSpecialFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">全部特殊标签</option>
          {SPECIAL_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredClips.map((clip) => (
          <div key={clip.id} className="border rounded p-4">
            <p className="font-medium mb-2">{clip.title}</p>
            <p className="text-sm text-gray-400 mb-2">
              {[clip.map, clip.agent, clip.kills, ...(clip.special ?? [])]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <video src={clip.video_url} controls className="w-full rounded" />
          </div>
        ))}
        {filteredClips.length === 0 && clips.length === 0 && (
          <p className="text-gray-500">还没有视频，点右上角上传第一个吧</p>
        )}
        {filteredClips.length === 0 && clips.length > 0 && (
          <p className="text-gray-500">没有符合筛选条件的视频</p>
        )}
      </div>
    </main>
  )
}
