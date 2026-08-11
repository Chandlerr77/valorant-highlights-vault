# 高光存档

平时打《无畏契约》(VALORANT) 出了好看的高光，想留着以后翻出来看、偶尔发给朋友，但游戏自带的战绩记录和手机相册都不好翻找，索性做了这个小工具：上传录屏，AI 顺手生成个标题建议，自己再打上地图/英雄/击杀数这些标签，之后想找哪一段直接筛选，也能生成一个不用登录就能打开的私密链接发给人看。

<p align="center">
  <a href="https://valorant-highlights-vault.vercel.app">
    <img src="https://img.shields.io/badge/在线预览-valorant--highlights--vault.vercel.app-1f6feb?style=for-the-badge&logo=vercel&logoColor=white" alt="在线预览" />
  </a>
  &nbsp;
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/Chandlerr77/valorant-highlights-vault&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,GEMINI_API_KEY">
    <img src="https://img.shields.io/badge/一键部署-Deploy%20with%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="一键部署到 Vercel" />
  </a>
</p>

## 功能全貌

- **上传**：选一个视频文件直接存进云端（单文件 49MB 以内）
- **AI 标题建议**：上传时自动截取视频关键帧，调用 Google Gemini 多模态 API 生成一句标题建议，可以直接改
- **结构化打标**：地图、英雄、击杀数（三杀~七杀）、特殊标签（比如经济局翻盘）手动选，标签列表在代码里维护，随时能加新的
- **精确筛选**：首页四个下拉筛选器，纯前端精确匹配，不依赖 AI，秒出结果
- **私密分享**：一键生成分享链接，对方打开不用登录也不会看到你的其它视频
- **删除管理**：删除时数据库记录和云端存储文件一起清理，不留垃圾文件

## 快速开始

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

Supabase 项目需要手动建一张 `clips` 表（字段：`title`、`video_url`、`map`、`agent`、`kills`、`special` text[]、`share_slug`），建一个名为 `clips` 的 Public Storage Bucket，关掉 `clips` 表的 RLS，并给 Storage 的 `clips` 桶加上 insert / select / delete 权限策略——这几步跟原版 Supabase 项目模板不一样，是这个项目特有的准备工作，没法靠"一键部署"跳过。

## 一键部署

已经部署在 **https://valorant-highlights-vault.vercel.app**。

点上方 "一键部署" 按钮可以基于这个仓库创建你自己的部署，Vercel 会提示你填三个环境变量；但记得先按上一节的步骤把 Supabase 项目和数据库准备好，否则部署完打开是空的、上传也会报错。

## 常用命令

```bash
npm run dev     # 本地开发
npm run build   # 生产构建
npm run start   # 启动生产服务
npm run lint    # ESLint 检查
```

## 关于 AI 识别

AI（Gemini）只负责根据截图生成一句开放式的标题建议，不保证准确，上传前可以直接编辑。地图、英雄、击杀数这些结构化标签特意做成了纯手动选择——早期版本试过让 AI 精确识别这些专有名词，实测下来单帧图像分类不够稳定，索性把"猜"这件事从 AI 的职责里拿掉了，只留它做开放式生成擅长的事。完整的方案调整过程记录在 [`docs/plans/`](docs/plans/) 里。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Supabase（PostgreSQL 数据库 + 对象存储）
- Google Gemini API（`@google/genai`）
- Vercel

## License

MIT，见 [LICENSE](./LICENSE)。
