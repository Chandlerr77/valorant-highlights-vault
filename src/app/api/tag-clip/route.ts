import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const image = formData.get('image') as File

  const buffer = Buffer.from(await image.arrayBuffer())
  const base64 = buffer.toString('base64')

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            {
              text: '这是一张《无畏契约》(VALORANT) 游戏截图。请结合画面氛围给这个视频片段起一个简短、生动的中文标题（不需要精确认出具体英雄或地图名字，凭大致印象写就行），只用JSON格式回复，不要多余文字，格式：{"title": "标题"}',
            },
          ],
        },
      ],
    })

    const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
    return NextResponse.json({ raw })
  } catch (e) {
    console.error('AI 生成标题失败', e)
    return NextResponse.json({ raw: '', error: 'AI 暂时不可用' }, { status: 200 })
  }
}
