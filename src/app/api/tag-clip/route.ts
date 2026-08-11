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
              text: '这是一张《无畏契约》(VALORANT) 游戏截图。请用一句开放式的中文描述这张截图里的画面内容（比如场景氛围、大致在做什么、如果看得出是否有击杀提示等），不需要精确认出具体英雄或地图的官方名字，看不清就写大概印象，只用JSON格式回复，不要多余文字，格式：{"description": "一句话中文描述", "title": "结合描述给这个片段起一个简短的中文标题"}',
            },
          ],
        },
      ],
    })

    const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
    return NextResponse.json({ raw })
  } catch (e) {
    console.error('AI 打标签调用失败', e)
    return NextResponse.json({ raw: '', error: 'AI 识别暂时不可用' }, { status: 200 })
  }
}
