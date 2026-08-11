import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的高光时刻</h1>
        <Link href="/upload" className="bg-black text-white px-4 py-2 rounded">
          + 上传
        </Link>
      </div>
      <div className="grid gap-4">
        {clips?.map((clip) => (
          <div key={clip.id} className="border rounded p-4">
            <p className="font-medium mb-2">{clip.title}</p>
            <video src={clip.video_url} controls className="w-full rounded" />
          </div>
        ))}
        {clips?.length === 0 && (
          <p className="text-gray-500">还没有视频，点右上角上传第一个吧</p>
        )}
      </div>
    </main>
  )
}
