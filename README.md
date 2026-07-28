# 求职排雷器

输入公司名称，AI 实时聚合多源口碑，生成结构化分析报告。

🔗 **在线体验**：[https://qiuzhi-pailei.vercel.app](https://qiuzhi-pailei.vercel.app)

## 功能

- 🔍 公司口碑搜索：聚合多个公开平台的员工评价
- 📊 四维度分析：薪酬福利、工作强度、管理文化、职业发展
- 📈 雷达图可视化：直观展示各维度评分
- 🎯 匹配度分析：根据个人偏好计算岗位匹配度
- 🔒 数据不落地：所有数据仅保存在浏览器本地，不存数据库

## 技术栈

- 前端：React + TypeScript + Vite + Tailwind CSS + ECharts
- 后端：Node.js + Express + TypeScript
- AI：DeepSeek API
- 搜索：DuckDuckGo（支持全球服务器，免 Key）

## 本地运行

### 前置要求

- Node.js >= 18
- DeepSeek API Key（[获取地址](https://platform.deepseek.com)）

### 步骤

1. 安装后端依赖并启动

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY
npm run dev
```

后端运行在 `http://localhost:3000`

2. 安装前端依赖并启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

3. 打开浏览器访问 `http://localhost:5173`，在首页输入 DeepSeek API Key 即可使用

## 部署

### 前端部署到 Vercel

1. Fork 本仓库到你的 GitHub
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
3. 点击 "Add New" → "Project"，选择你的仓库
4. Framework Preset 选 "Vite"
5. Root Directory 填 `frontend`
6. Environment Variables 添加：`VITE_API_BASE_URL` = 你的后端地址
7. 点击 "Deploy"，等待部署完成

### 后端部署到 Render

1. 打开 [render.com](https://render.com)，用 GitHub 登录
2. 点击 "New" → "Web Service"
3. 选择你的仓库
4. 配置：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: 添加 `DEEPSEEK_API_KEY`，值为你的 DeepSeek Key
5. 点击 "Create Web Service"，等待部署完成

### 连接前后端

部署完成后：

1. 复制 Render 后端的域名（类似 `https://xxx.onrender.com`）
2. 打开 Vercel 前端项目 → Settings → Environment Variables
3. 添加变量：
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: 你的 Render 后端域名（如 `https://qiuzhi-pailei.onrender.com`）
   - **Environment**: 勾选 Production 和 Preview
4. 保存后 Vercel 会自动重新部署

### 快捷部署

项目已包含 `render.yaml` 和 `vercel.json` 配置文件，点击仓库上的 "Deploy to Vercel" 或 "Deploy to Render" 按钮即可快速部署。

## 项目结构

```
├── frontend/          # 前端 React 应用
│   ├── src/pages/     # 页面组件（搜索页、报告页、匹配页）
│   ├── src/data/      # 状态管理、API 调用、类型定义
│   └── src/utils/     # 工具函数（匹配度计算）
└── backend/           # 后端 Express 服务
    └── src/           # 搜索、清洗、AI 分析、反爬
```

## 免责声明

数据来源于公开平台，仅供参考。不存储任何数据，所有搜索结果仅在当前会话中可见。
