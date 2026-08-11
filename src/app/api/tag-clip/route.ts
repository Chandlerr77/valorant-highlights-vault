import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { VALORANT_MAPS, VALORANT_AGENTS, KILL_OPTIONS, SPECIAL_OPTIONS } from '@/lib/valorantData'

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
              text: `这是一张《无畏契约》(VALORANT) 游戏截图。请识别画面中的信息，只用JSON格式回复，不要多余文字，格式：
{
  "map": "从这个名单里选一个最像的，不确定就填空字符串：${VALORANT_MAPS.join('、')}",
  "agent": "从这个名单里选一个最像的，不确定就填空字符串：${VALORANT_AGENTS.join('、')}",
  "kills": "如果画面显示了击杀提示，从这几个里选：${KILL_OPTIONS.join('、')}，没有就填空字符串",
  "special": "如果画面能看出符合这些特殊情况，从这个名单里选（可以选多个，用逗号分隔），都不符合就填空字符串：${SPECIAL_OPTIONS.join('、')}",
  "title": "结合以上信息给这个片段起一个简短的中文标题"
}`,
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
