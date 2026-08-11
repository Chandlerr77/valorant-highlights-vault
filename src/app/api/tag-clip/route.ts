import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const image = formData.get('image') as File

  const buffer = Buffer.from(await image.arrayBuffer())
  const base64 = buffer.toString('base64')

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          {
            text: '这是一张《瓦罗兰特》(Valorant) 游戏高光时刻截图。请判断画面里是否显示了击杀提示（比如 TRIPLE KILL / QUAD KILL / ACE 等字样），并只用JSON格式回复，不要多余文字，格式：{"kills": "三杀/四杀/五杀/未知", "title": "给这个片段起一个简短的中文标题"}',
          },
        ],
      },
    ],
  })

  const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
  return NextResponse.json({ raw })
}
