import { supabase } from '@/lib/supabase'

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: clip } = await supabase.from('clips').select('*').eq('share_slug', slug).single()

  if (!clip) {
    return (
      <main className="max-w-xl mx-auto px-6 py-12 sm:px-10">
        <p className="text-sm text-[#8a8a8a]">链接无效或已失效</p>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-12 sm:px-10">
      <p className="text-2xl font-bold tracking-tight mb-3">{clip.title}</p>
      {(clip.map || clip.agent || clip.kills || (clip.special ?? []).length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6 text-xs tabular-nums">
          {[clip.map, clip.agent, ...(clip.special ?? [])].filter(Boolean).map((tag: string, i: number) => (
            <span key={i} className="border-l-2 border-[#8a8a8a] pl-2 text-[#8a8a8a]">
              {tag}
            </span>
          ))}
          {clip.kills && (
            <span className="border-l-2 border-[#ff3b30] pl-2 text-[#ff3b30]">{clip.kills}</span>
          )}
        </div>
      )}
      <video src={clip.video_url} controls autoPlay className="w-full" />
    </main>
  )
}
