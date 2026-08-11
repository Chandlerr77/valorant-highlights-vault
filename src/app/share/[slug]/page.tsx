import { supabase } from '@/lib/supabase'

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: clip } = await supabase.from('clips').select('*').eq('share_slug', slug).single()

  if (!clip) {
    return <main className="p-8">链接无效或已失效</main>
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <p className="font-medium mb-2 text-xl">{clip.title}</p>
      <p className="text-sm text-gray-400 mb-4">
        {[clip.map, clip.agent, clip.kills, ...(clip.special ?? [])].filter(Boolean).join(' · ')}
      </p>
      <video src={clip.video_url} controls autoPlay className="w-full rounded" />
    </main>
  )
}
