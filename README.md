# 高光存档

个人《无畏契约》(VALORANT) 游戏高光视频管理网站。上传录屏，AI 自动生成标题建议，按地图/英雄/击杀数打标签，支持精确筛选和私密分享链接。

**在线体验**：[valorant-highlights-vault.vercel.app](https://valorant-highlights-vault.vercel.app/)

## 功能

- **上传**：拖入视频文件，直接存进云端
- **AI 标题建议**：上传时自动截取视频关键帧，调用 Google Gemini 多模态 API 生成标题建议，可编辑
- **结构化标签**：按地图、英雄、击杀数（三杀~七杀）、特殊标签（如经济局翻盘）手动打标，可扩展
- **精确筛选**：首页四个下拉筛选器，纯前端精确匹配，无需等待
- **私密分享**：一键生成分享链接，无需登录即可查看单个视频
- **删除管理**：同步清理数据库记录和云端存储文件

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **后端**：Supabase（PostgreSQL 数据库 + 对象存储）
- **AI**：Google Gemini API（`@google/genai`），多模态图像理解生成标题建议
- **部署**：Vercel

## 本地运行

```bash
npm install
```

在项目根目录创建 `.env.local`：

```
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon/publishable key
GEMINI_API_KEY=你的 Gemini API key
```

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

Supabase 项目需要一张 `clips` 表（字段：`title`、`video_url`、`map`、`agent`、`kills`、`special` text[]、`share_slug`）和一个名为 `clips` 的 Public Storage Bucket，关闭 `clips` 表的 RLS，并为 Storage 的 `clips` 桶添加 insert/select/delete 权限策略。

## 开发过程

完整的实施计划和迭代记录见 [`docs/plans/`](docs/plans/)，记录了从最初设想（AI 精确识别地图/英雄）到实测发现单帧图像分类不稳定、几次调整方案，最终收敛到"AI 生成开放式建议 + 结构化标签手动确认"的完整过程，包括 Supabase RLS 权限、Storage 文件大小限制、Gemini 免费额度等实际踩坑记录。

## License

MIT
