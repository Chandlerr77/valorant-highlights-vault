# 瓦罗兰特高光时刻私人网站 — MVP 实施计划

**目标**：3天内做出一个能打开网址使用的真实网页，包含上传视频、AI自动打标签、关键词搜索、私密分享链接。最终用于简历上的AI项目展示。

**读者假设**：你完全没有编程背景。每个任务都会告诉你：改哪个文件、写什么内容（代码已经给好，直接复制）、跑什么命令、应该看到什么结果。看不懂代码没关系，你只需要负责"验证结果对不对"。

**技术栈**：
- 前端框架：Next.js（React）
- 数据库 + 文件存储 + 分享链接：Supabase（免费额度够用，不用自己搭服务器）
- AI 打标签：Google Gemini API（读取视频截图，识别击杀数并生成标题）
- 部署：Vercel（免费，几分钟出一个真实网址）

**如何使用这份计划**：每个任务都是独立的一小段，做完一个再做下一个。每个任务做完后都有"验证"步骤——按提示操作，看到预期结果就说明这一步做对了，可以进入下一步。如果卡住，把报错信息原样发给 AI 编程工具就行。

---

## Day 1：搭骨架 —— 上传视频 + 列表展示

### Task 1.1：创建项目

**目的**：生成一个空白的网页项目骨架。

**步骤**：
1. 打开终端，进入你想存放项目的文件夹（比如 `C:\Users\Administrator\Projects`）
2. 运行：
   ```
   npx create-next-app@latest valorant-highlights-vault --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
3. 一路选默认选项（直接回车）即可
4. 进入项目文件夹：`cd valorant-highlights-vault`
5. 启动开发服务器：`npm run dev`

**验证**：浏览器打开 `http://localhost:3000`，能看到 Next.js 的默认欢迎页面，说明项目搭建成功。

**提交**：
```
git init
git add -A
git commit -m "init: 创建 Next.js 项目骨架"
```

---

### Task 1.2：注册 Supabase，创建数据库表和存储桶

**目的**：准备好存视频文件和视频信息的地方。

**步骤**：
1. 去 supabase.com 注册账号，创建一个新项目（New Project），项目名随意，比如 `highlights-vault`
2. 项目创建完成后，进入左侧菜单 **Table Editor**，点 "New Table"，创建一个名为 `clips` 的表，字段如下：
   - `id`（默认自带，uuid，主键）
   - `created_at`（默认自带，时间戳）
   - `title`：text
   - `video_url`：text
   - `tags`：text（先留空，Day2 用来存AI生成的标签，比如"三杀"）
   - `share_slug`：text（Day3 用来做分享链接，先留空）
3. 进入左侧菜单 **Storage**，点 "New Bucket"，创建一个名为 `clips` 的存储桶（Public bucket 选项先勾上，方便 MVP 阶段直接读取）
4. 进入左侧菜单 **Project Settings → API**，记下两个值：
   - `Project URL`
   - `anon public` key（这是公开可用的密钥，不是私密密钥）

**验证**：Table Editor 里能看到 `clips` 表，Storage 里能看到 `clips` 存储桶。

---

### Task 1.3：连接 Supabase

**文件**：
- Create: `.env.local`
- Create: `src/lib/supabase.ts`
- Modify: `package.json`（安装依赖）

**步骤**：
1. 安装依赖：
   ```
   npm install @supabase/supabase-js
   ```
2. 在项目根目录创建 `.env.local`，内容（把值换成你 Task 1.2 记下的）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon public key
   ```
3. 创建 `src/lib/supabase.ts`：
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

**验证**：重启开发服务器（`Ctrl+C` 停掉，再 `npm run dev`），页面不报错即可（这一步还看不到实际效果，只是打好地基）。

**提交**：
```
git add -A
git commit -m "feat: 接入 Supabase 客户端"
```

> 注意：`.env.local` 已被 Next.js 自动加入 `.gitignore`，不会被提交，密钥不会泄露。

---

### Task 1.4：上传页面

**文件**：
- Create: `src/app/upload/page.tsx`

**步骤**：

创建 `src/app/upload/page.tsx`：
```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('clips')
      .upload(fileName, file)

    if (uploadError) {
      alert('上传失败：' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName)

    const { error: insertError } = await supabase.from('clips').insert({
      title: title || file.name,
      video_url: publicUrlData.publicUrl,
    })

    if (insertError) {
      alert('保存记录失败：' + insertError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    router.push('/')
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">上传高光视频</h1>
      <input
        type="text"
        placeholder="给这个片段起个名字（可选）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? '上传中...' : '上传'}
      </button>
    </main>
  )
}
```

**验证**：浏览器打开 `http://localhost:3000/upload`，选一个手机里的高光视频文件，点上传，等待完成后应该自动跳回首页（首页现在还是空的没关系，下一步做）。回 Supabase 后台的 Storage 和 Table Editor 检查：`clips` 存储桶里应该多了一个视频文件，`clips` 表里应该多了一条记录。

**提交**：
```
git add -A
git commit -m "feat: 视频上传页面"
```

---

### Task 1.5：首页视频列表

**文件**：
- Modify: `src/app/page.tsx`（整个替换）

**步骤**：

替换 `src/app/page.tsx`：
```tsx
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
```

**验证**：浏览器打开 `http://localhost:3000`，能看到刚才上传的视频，点击能播放。这一步完成后，Day 1 的目标（上传+展示）就跑通了。

**提交**：
```
git add -A
git commit -m "feat: 首页视频列表展示"
```

---

## Day 2：接入 AI 自动打标签

> 设计说明：AI 目前不能直接"看"视频，所以思路是——在浏览器里从视频中截一帧图片（比如第2秒画面，高光时刻通常这时候击杀提示还在屏幕上），把这张截图发给能识图的 AI 模型，让它读画面里的击杀提示文字（如"TRIPLE KILL"），生成标题和标签。
>
> **变更记录（执行时调整）**：原计划用 Claude API，用户希望更便宜的方案，改用 **Google Gemini Flash**（识图能力够用，免费额度大）。以下 Task 2.1 和 2.3 已按 Gemini 更新。

### Task 2.1：申请 Gemini API Key

**步骤**：
1. 去 aistudio.google.com（Google AI Studio）注册账号，可能需要科学上网
2. 左侧找 "Get API key"，创建一个新 key，复制保存好
3. 在 `.env.local` 里新增一行：
   ```
   GEMINI_API_KEY=你的key
   ```
   （这个不加 `NEXT_PUBLIC_` 前缀，因为只在服务器端用，不能暴露给浏览器）

**验证**：`.env.local` 里现在有 3 行配置。重启 `npm run dev` 不报错。

---

### Task 2.2：写一个"从视频截图"的小工具

**文件**：
- Create: `src/lib/extractFrame.ts`

**步骤**：

创建 `src/lib/extractFrame.ts`：
```typescript
export function extractFrame(file: File, atSeconds = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.crossOrigin = 'anonymous'
    video.muted = true

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSeconds, video.duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('截图失败'))
        URL.revokeObjectURL(video.src)
      }, 'image/jpeg', 0.9)
    }

    video.onerror = () => reject(new Error('视频加载失败'))
  })
}
```

**验证**：这一步是纯工具函数，看不到界面效果，先跳到下一步一起验证。

---

### Task 2.3：写调用 Gemini 打标签的 API 路由

**文件**：
- Create: `src/app/api/tag-clip/route.ts`
- Modify: `package.json`（安装依赖）

**步骤**：
1. 安装依赖：
   ```
   npm install @google/genai
   ```
2. 创建 `src/app/api/tag-clip/route.ts`：
   ```typescript
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

     // Gemini 有时会把 JSON 包在 ```json 代码块里，这里先剥掉再返回
     const raw = (response.text ?? '').replace(/```json\s*|```\s*/g, '').trim()
     return NextResponse.json({ raw })
   }
   ```

**变更记录（执行时调整）**：
1. `gemini-2.5-flash` 对新账号已下线，改用别名 `gemini-flash-latest`
2. Gemini 返回的文本会包在 ` ```json ` 代码块里，加了一步剥离，否则前端 `JSON.parse` 会报错

**验证**：本地用 curl 测试接口，返回了干净的 JSON（`{"kills":"...", "title":"..."}`），接口本身没问题。完整流程留到 Task 2.4 一起测。

---

### Task 2.4：把打标签流程接进上传页面

**文件**：
- Modify: `src/app/upload/page.tsx`

**步骤**：

在 `handleUpload` 函数里，找到 `insert` 之前，插入截图+打标签逻辑。把整个 `handleUpload` 函数替换成：
```tsx
  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('clips')
      .upload(fileName, file)

    if (uploadError) {
      alert('上传失败：' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName)

    // AI 自动打标签
    let tags = ''
    let aiTitle = ''
    try {
      const { extractFrame } = await import('@/lib/extractFrame')
      const frameBlob = await extractFrame(file)
      const form = new FormData()
      form.append('image', frameBlob, 'frame.jpg')
      const res = await fetch('/api/tag-clip', { method: 'POST', body: form })
      const data = await res.json()
      const parsed = JSON.parse(data.raw)
      tags = parsed.kills
      aiTitle = parsed.title
    } catch (e) {
      console.error('AI 打标签失败，使用手动标题', e)
    }

    const { error: insertError } = await supabase.from('clips').insert({
      title: title || aiTitle || file.name,
      video_url: publicUrlData.publicUrl,
      tags,
    })

    if (insertError) {
      alert('保存记录失败：' + insertError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    router.push('/')
  }
```

同时在首页 `src/app/page.tsx` 的视频卡片里加一行显示标签，把 `<p className="font-medium mb-2">{clip.title}</p>` 改成：
```tsx
<p className="font-medium mb-2">
  {clip.title} {clip.tags && <span className="text-sm text-gray-400">· {clip.tags}</span>}
</p>
```

**验证**：上传一个瓦罗兰特高光视频（画面里能看到击杀提示的那种），上传完成跳回首页后，应该能看到 AI 自动生成的标题，标题旁边显示"三杀/四杀/五杀"这样的标签。这一步是整个项目里"AI含量"最高的部分，也是简历上最值得写的一句话。

**提交**：
```
git add -A
git commit -m "feat: 上传时自动截图并用 Gemini 识别击杀标签"
```

---

### Task 2.5：关键词搜索

**文件**：
- Modify: `src/app/page.tsx`（改成客户端组件以支持交互搜索）

**步骤**：

把 `src/app/page.tsx` 整个替换成：
```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Clip = {
  id: string
  title: string
  video_url: string
  tags: string
}

export default function HomePage() {
  const [clips, setClips] = useState<Clip[]>([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClips(data ?? []))
  }, [])

  const filtered = clips.filter(
    (c) =>
      c.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      c.tags?.toLowerCase().includes(keyword.toLowerCase())
  )

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的高光时刻</h1>
        <Link href="/upload" className="bg-black text-white px-4 py-2 rounded">
          + 上传
        </Link>
      </div>
      <input
        type="text"
        placeholder="搜索标题或标签，比如“五杀”"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      <div className="grid gap-4">
        {filtered.map((clip) => (
          <div key={clip.id} className="border rounded p-4">
            <p className="font-medium mb-2">
              {clip.title} {clip.tags && <span className="text-sm text-gray-400">· {clip.tags}</span>}
            </p>
            <video src={clip.video_url} controls className="w-full rounded" />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500">没有匹配的视频</p>}
      </div>
    </main>
  )
}
```

**验证**：在搜索框输入"五杀"，列表应该只剩下标签含"五杀"的视频。这样 Day 2 的目标（AI打标签 + 搜索）就完成了。

**提交**：
```
git add -A
git commit -m "feat: 关键词搜索"
```

---

## Day 3：私密分享 + 部署上线 + 收尾

### Task 3.1：私密分享链接

**文件**：
- Modify: `src/app/page.tsx`（加分享按钮）
- Create: `src/app/share/[slug]/page.tsx`

**步骤**：
1. 在首页每个视频卡片里加一个"生成分享链接"按钮。在 `src/app/page.tsx` 的视频卡片 `<div>` 内、`<video>` 标签下方加：
   ```tsx
   <button
     onClick={async () => {
       const slug = clip.id
       await supabase.from('clips').update({ share_slug: slug }).eq('id', clip.id)
       const url = `${window.location.origin}/share/${slug}`
       navigator.clipboard.writeText(url)
       alert('分享链接已复制：' + url)
     }}
     className="mt-2 text-sm text-blue-600 underline"
   >
     生成分享链接并复制
   </button>
   ```
2. 创建分享页面 `src/app/share/[slug]/page.tsx`：
   ```tsx
   import { supabase } from '@/lib/supabase'

   export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
     const { slug } = await params
     const { data: clip } = await supabase.from('clips').select('*').eq('share_slug', slug).single()

     if (!clip) {
       return <main className="p-8">链接无效或已失效</main>
     }

     return (
       <main className="max-w-xl mx-auto p-8">
         <p className="font-medium mb-4 text-xl">{clip.title}</p>
         <video src={clip.video_url} controls autoPlay className="w-full rounded" />
       </main>
     )
   }
   ```

**验证**：点击某个视频的"生成分享链接"，链接会自动复制到剪贴板。把链接粘贴到浏览器新标签页（或发给自己的另一个设备）打开，应该能直接看到这个视频，不需要登录。

**提交**：
```
git add -A
git commit -m "feat: 私密分享链接"
```

---

### Task 3.2：部署到 Vercel

**步骤**：
1. 把代码推到 GitHub（如果还没有仓库，先在 github.com 新建一个空仓库，按提示 `git remote add origin ...` 然后 `git push`）
2. 去 vercel.com，用 GitHub 账号登录，点 "Add New Project"，选择你刚推上去的仓库
3. 在部署配置页面的 "Environment Variables" 里，把 `.env.local` 里的三个变量原样加进去（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`GEMINI_API_KEY`）
4. 点 Deploy，等 1-2 分钟

**验证**：Vercel 会给你一个形如 `https://valorant-highlights-vault-xxx.vercel.app` 的真实网址，手机和电脑都能直接打开，上传、搜索、分享功能都应该照常工作。

---

### Task 3.3：界面收尾（可选，视时间而定）

**步骤**（挑感觉最需要的做，不用全做）：
- 给首页加个简单的标题栏/说明文字
- 上传中显示进度提示已经有了（"上传中..."按钮文案）
- 视频卡片可以加个日期显示（用 `clip.created_at`）
- 手机端看一下页面有没有明显错位（Tailwind 默认响应式一般没问题）

**验证**：手机浏览器打开 Vercel 网址，操作一遍完整流程（上传→看到AI标签→搜索→生成分享链接），体验顺畅即可，不用追求完美。

---

### Task 3.4：整理简历素材

**步骤**：
1. 录一段 30 秒左右的操作屏幕（上传 → AI 自动打标签 → 搜索 → 生成分享链接），存起来，面试时可以放
2. 截 2-3 张关键页面截图
3. 写一句简历描述，可以参考这个方向：
   > 独立设计并开发个人游戏高光视频管理网站，前端使用 Next.js，后端基于 Supabase 实现文件存储与数据库；接入 Google Gemini 多模态 API 自动识别视频关键帧中的击杀信息并生成标签，实现免手动标注的内容归类；支持关键词检索与私密分享链接生成，完整部署上线。

**验证**：素材齐了，这份 MVP 就算完整交付了。

---

## 完成后可选的延伸方向（不在3天范围内，供之后参考）

- 把语义搜索（用 embedding 而不是关键词匹配）加上
- 把这个模块嵌入个人介绍网站的"爱好"板块里
- 支持批量上传/多游戏
