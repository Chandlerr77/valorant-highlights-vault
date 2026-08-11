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
            text: '这是一张《无畏契约》(VALORANT 国服，简体中文客户端) 游戏截图。请识别画面中的信息，只用JSON格式回复，不要多余文字，格式：{"agent": "画面中使用的英雄角色的简体中文官方名称，如果画面上没有直接显示文字、你也不完全确定官方译名，就填空字符串，不要猜测或直译英文名", "map": "地图的简体中文官方名称，同样不确定就填空字符串，不要瞎猜", "kills": "如果画面显示了击杀提示（TRIPLE KILL/QUAD KILL/ACE等），填三杀/四杀/五杀，没有则填空字符串", "title": "结合以上信息给这个片段起一个简短的中文标题"}',
          },
        ],
      },
    ],
  })

  const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
  return NextResponse.json({ raw })
}
