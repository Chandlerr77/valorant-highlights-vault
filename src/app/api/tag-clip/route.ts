import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const VALORANT_MAPS = [
  '亚海悬城', '源工重镇', '隐世修所', '霓虹町', '森寒冬港', '微风岛屿',
  '裂变峡谷', '深海明珠', '莲华古城', '日落之城', '幽邃地窟', '盐海矿镇', '天枢云阙',
]

const VALORANT_AGENTS = [
  '不死鸟', '捷风', '雷兹', '芮娜', '夜露', '霓虹', '壹决', '幻棱',
  '炼狱', '蝰蛇', '幽影', '星礈', '海神', '暮蝶',
  '猎枭', '铁臂', '斯凯', 'K/O', '黑梦', '盖可', '钛狐',
  '贤者', '瑟符', '奇乐', '尚勃勒', '钢锁',
]

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
            text: `这是一张《无畏契约》(VALORANT 国服，简体中文客户端) 游戏截图。

游戏里全部地图的官方简体中文名称（只能从这里面选，不要用别的翻译）：
${VALORANT_MAPS.join('、')}

游戏里全部英雄角色的官方简体中文名称（只能从这里面选，不要用别的翻译或俗称）：
${VALORANT_AGENTS.join('、')}

请识别画面中的信息，只用JSON格式回复，不要多余文字，格式：{"agent": "从上面英雄名单里选一个匹配的，识别不出或不确定就填空字符串", "map": "从上面地图名单里选一个匹配的，识别不出或不确定就填空字符串", "kills": "如果画面显示了击杀提示（TRIPLE KILL/QUAD KILL/ACE等），填三杀/四杀/五杀，没有则填空字符串", "title": "结合以上信息给这个片段起一个简短的中文标题"}`,
          },
        ],
      },
    ],
  })

  const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
  return NextResponse.json({ raw })
}
