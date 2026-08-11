import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query || !query.trim()) {
    return NextResponse.json({ ids: null })
  }

  const { data: clips } = await supabase.from('clips').select('id, title, tags')

  if (!clips || clips.length === 0) {
    return NextResponse.json({ ids: [] })
  }

  const listText = clips
    .map((c) => `id=${c.id}: 标题="${c.title ?? ''}" 描述="${c.tags ?? ''}"`)
    .join('\n')

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `用户在一个游戏高光视频库里搜索，搜索词是："${query}"。下面是库里所有视频的标题和描述：\n${listText}\n\n请判断哪些视频跟这个搜索词语义相关（不要求关键词完全匹配，理解意思即可），只返回一个JSON数组，元素是匹配视频的id，按相关性从高到低排列，不要多余文字。如果都不相关就返回空数组 []。`,
            },
          ],
        },
      ],
    })

    const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()

    let ids: string[] = []
    try {
      ids = JSON.parse(raw)
    } catch (e) {
      console.error('搜索结果解析失败', e, raw)
    }

    return NextResponse.json({ ids })
  } catch (e) {
    console.error('AI 搜索调用失败', e)
    return NextResponse.json({ ids: [], error: 'AI 搜索暂时不可用，请稍后再试' }, { status: 200 })
  }
}
