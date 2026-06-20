# AGENTS.md — 找猹 / FindX

> 本文件用于在上下文压缩后让后续 Agent 快速理解项目约束与关键决策。

## 1. 项目定位

- **中文名**：找猹（在网络评论区里“找杠精/找茬”）
- **英文名**：FindX（Find the fallacy / Find the toxic comment）
- **性质**：Python 与人工智能应用大作业 / 开源游戏项目
- **域名**：https://findx.hub.tt2.li
- **仓库**：https://github.com/NLPark-Cran/findx（公开仓库）

## 2. 核心玩法

玩家在中国网络评论（B站/贴吧风格）中遇到令人愤怒且含逻辑谬误的言论：

1. 系统用 **文本情感分析** 给出“情绪雷达图”（愤怒、讽刺、厌恶、轻蔑、恐惧、喜悦、悲伤、惊讶）。
2. **第一步：识别谬误** — 玩家从 12 种逻辑谬误中选出评论包含的 1–2 种；默认不显示答案，可点击提示查看。
3. **第二步：选择武器** — 根据已识别的谬误，选择最克制的逻辑武器卡牌。
4. **第三步：自由反驳** — 输入一句话解释为什么这是谬误并反击。
5. LLM 裁判从「谬误识别」「武器匹配」「反驳质量」三个维度打分，并给出改进建议。
6. 提交后显示**对手反应（OS）**：对方内心戏 + 8 维情绪变化。
7. 支持剧情闯关、实时 PvP、AgenTank 风格的 Agent 对战与排行榜。

## 3. 技术栈与关键决策

| 层级 | 技术 | 决策理由 |
|---|---|---|
| 前端 | **Next.js 15 + React 19 + TypeScript** | 现代 App Router、Server Actions、流式支持 |
| UI | **Tailwind CSS + shadcn/ui** | 可拷贝组件、主题可调 |
| 设计风格 | **Mercure 2.0 + Apple.com 极简** | 深色：暖 Navy + 琥珀金；浅色：亚麻米白 + 暖金棕 + 鼠尾草绿 |
| 主题切换 | **next-themes** | 支持 light / dark 双主题 |
| 图表/动画 | **ECharts + Framer Motion** | 情绪雷达、统计图、卡牌动效 |
| 国际化 | **next-intl** | 中英双语切换 |
| 状态 | **Zustand** | 轻量、可持久化 |
| 后端 | **FastAPI + Python 3.13** | Python AI 项目事实标准 |
| 数据库 | **PostgreSQL**（复用本机） | 已有常驻实例，无需 Docker |
| 缓存 | **Redis**（复用本机） | 缓存 LLM 结果、WebSocket 状态 |
| 情感/裁判 | **TokenDance `qwen3.7-max`** | 纯文本最强模型，JSON 输出，不跑本地大模型 |
| Agent 执行 | **TokenDance 多模型可选** | Agent 可自选 `qwen3.7-max` / `deepseek-v3.2` 等 |
| 素材 | **MiniMax API / `mmx-cli`** | 图片、音乐、语音生成 |
| UI Skill | **Citycraft / taste-skill / ui-ux-pro-max-skill** | 观猹推荐的 Vibe Coding 整容 Skill |
| 部署 | **Nginx + Certbot + 本地进程** | 无 Docker，端口 8006/3006，复用本机 Nginx |

**绝不引入**：Docker、本地 Transformer 模型、Caddy（本机已有 Nginx）。

## 4. 环境变量

复制 `.env.example` 为 `.env` 并填写（真实密钥不在仓库中）：

```bash
DATABASE_URL=postgresql+asyncpg://findx_user:findx_password@localhost:5432/findx
REDIS_URL=redis://localhost:6379/0
TOKENDANCE_API_KEY=sk-...
TOKENDANCE_BASE_URL=https://tokendance.space/gateway/v1
TOKENDANCE_MODEL=qwen3.7-max
MINIMAX_API_KEY=sk-...
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
FRONTEND_URL=https://findx.hub.tt2.li
BACKEND_PORT=8006
FRONTEND_PORT=3006
```

> `.env` 已加入 `.gitignore`，禁止提交。

### 3.1 设计原则（必须遵守）

- **Apple 式极简**：大留白、大字号、细字重、微妙阴影、精致圆角。
- **Mercure 2.0 暖调**：
  - 深色：背景 `#1a2233`，主强调 `#c9a04c`（琥珀金），次强调 `#8b9d83`（鼠尾草绿），点缀 `#b86b52`（赤陶）。
  - 浅色：背景 `#f7f5f0`（亚麻米白），卡片 `#ffffff`，主强调 `#b8976b`（暖金棕），次强调 `#8a9a82`，点缀 `#c17a5c`。
- **避免**：高饱和霓虹、复杂装饰、密集边框、像素游戏风按钮阴影。

## 5. 本地开发命令

```bash
# 后端
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8006 --reload

# 前端
cd frontend
npm install
npm run dev        # 或 build + start -p 3006
```

## 6. 项目结构

```
findx/
├── AGENTS.md                 # 本文件
├── README.md
├── .env.example
├── .gitignore
├── nginx-findx.conf.example  # Nginx 配置模板
├── start.sh                  # 启动脚本（可选）
├── scripts/                  # 生成脚本
│   ├── generate_levels.py
│   ├── generate_assets.sh
│   └── agent_guide.md
├── backend/                  # FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── config.py
│       ├── models/db.py
│       ├── api/              # REST + WebSocket 路由
│       └── services/         # LLM、裁判、对战、Agent
└── frontend/                 # Next.js 15
    ├── app/                  # App Router
    ├── components/
    ├── lib/
    └── public/assets/
```

## 7. 后端 API 速查

- `POST /auth/register` — 注册用户名
- `GET  /health` — 健康检查
- `POST /sentiment/analyze` — 分析评论情绪与谬误
- `POST /fallacy/evaluate` — 判定武器+反驳是否命中
- `GET  /levels` / `GET /levels/{id}` — 关卡与评论数据
- `POST /game/submit-move` — 单人模式提交一次出牌（`detected_fallacies` + 返回 `opponent_reaction`）
- `POST /game/finish` — 单人模式结算
- `POST /pvp/rooms` — 创建 PvP 房间
- `WS   /pvp/ws/{room_id}` — PvP WebSocket 对战
- `POST /agent/fighters` — 创建 Agent
- `GET  /agent/fighter`（Header `X-Agent-Key`）— 读取 Agent
- `POST /agent/fighter/code` — 发布新版策略
- `POST /agent/fighter/simulate` — 模拟战 vs 训练 Bot
- `POST /agent/fighter/challenge` — 挑战真实 Agent
- `GET  /agent/leaderboard` — Agent 排行榜
- `GET  /agent/opponents` — 可挑战的公开 Agent
- `GET  /agent/matches` — 最近对战记录

## 8. 关键约定

### 8.1 谬误与武器 ID

谬误与武器名称输出格式固定为 `中文 / English`（英文环境下为 `English / 中文`），例如 `诉诸人身 / Ad Hominem`。

新增谬误 ID 与推荐武器映射（见 `backend/app/services/llm_client.py` 与 `frontend/lib/fallacies.ts`）：

- `ad_hominem` — 诉诸人身 / Ad Hominem
- `slippery_slope` — 滑坡谬误 / Slippery Slope
- `straw_man` — 稻草人 / Straw Man
- `false_dilemma` — 非黑即白 / False Dilemma
- `survivorship_bias` — 幸存者偏差 / Survivorship Bias
- `appeal_to_authority` — 诉诸权威 / Appeal to Authority
- `equivocation` — 偷换概念 / Equivocation
- `appeal_to_emotion` — 诉诸情感 / Appeal to Emotion
- `circular_reasoning` — 循环论证 / Circular Reasoning
- `false_causality` — 虚假因果 / False Causality
- `hasty_generalization` — 以偏概全 / Hasty Generalization
- `loaded_question` — 诱导性问题 / Loaded Question

武器 ID 使用英文 snake_case，并绑定 `target_fallacies`：

- `clarifier` — 逻辑澄清弹 / Clarifier
- `evidence_shield` — 证据护盾 / Evidence Shield
- `reductio_sword` — 归谬剑 / Reductio Sword
- `debunk_hammer` — 拆解锤 / Debunk Hammer
- `causal_lens` — 因果显微镜 / Causal Lens
- `statistical_lens` — 统计透镜 / Statistical Lens
- `socratic_trap` — 反问陷阱 / Socratic Trap

### 8.2 LLM JSON 输出

所有 LLM 调用使用 `response_format={"type": "json_object"}`，后端用 `_extract_json` 兜底解析 fenced JSON。字段命名保持小写 snake_case。

### 8.3 数据库

- 使用 SQLAlchemy 2.0 async + asyncpg。
- 模型定义在 `backend/app/models/db.py`。
- 启动时 `init_db()` 自动建表（MVP 阶段，后续可迁移到 Alembic）。

### 8.4 中英双语

- 默认语言：`zh`。
- 所有 UI 文案走 next-intl 翻译文件。
- 后端接口接受 `language` 参数（`zh` 或 `en`）。
- LLM 提示词根据 `language` 动态切换输出语言。

## 9. 部署

1. 确保后端跑在 `127.0.0.1:8006`，前端跑在 `127.0.0.1:3006`。
2. 使用 `nginx-findx.conf.example` 创建 `/etc/nginx/sites-available/findx.hub.tt2.li`。
3. `sudo certbot --nginx -d findx.hub.tt2.li`
4. `sudo nginx -t && sudo systemctl reload nginx`

生产进程守护使用 systemd user service 或 pm2。

## 10. 安全与凭证

- API Key 只保存在 `.env` 和运行环境变量中，禁止硬编码。
- Agent Key 用于 Agent API 认证，等同密码，不可泄露。
- 数据库密码仅在 `.env` 和 PostgreSQL 中。

## 11. Agent 约束与踩坑记录（必须遵守）

### 11.1 不要用 Cran Code 后台任务跑长时间安装/服务

Cran Code 的 `Shell(run_in_background=true)` 对 npm install、pip install、uvicorn 等长任务有 **heartbeat 超时**，会触发 `task.lost` 或 `Tool execution cancelled`。

- **安装依赖**：用 **前台 Shell**，`timeout <= 300s`；npm 若卡住，先完整删除 `node_modules` 和 `package-lock.json` 再重装。
- **运行服务**：用 **PM2** 或 **systemd**，不要用后台 Shell 任务。

### 11.2 npm ENOTEMPTY 处理

如果 npm 报错 `ENOTEMPTY: directory not empty, rename .../.next-xxx`，说明上次安装被中断留下了临时目录。修复：

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 11.3 PM2 运行 Python 虚拟环境脚本

PM2 默认用 Node 解释器跑脚本。管理 Python 服务时必须显式指定虚拟环境的 Python：

```bash
pm2 start backend/.venv/bin/uvicorn \
  --name findx-backend \
  --cwd backend \
  --interpreter /root/workspace/test0607/test6/backend/.venv/bin/python3 \
  -- main:app --host 127.0.0.1 --port 8006
```

### 11.4 环境变量与 .env

- `.env` 位于项目根目录。
- `backend/app/config.py` 已写死从 `Path(__file__).resolve().parent.parent.parent / ".env"` 加载，即项目根目录。
- PM2 启动后端时不需要额外传 env，config 会自动读取 `.env`。

### 11.5 数据库访问

- 本机原有 PostgreSQL/Redis 由 **eastmind** 项目（`/opt/eastmind/docker-compose.yml`，工作区 `/root/workspace/eastmind`）以 Docker Compose 启动，未映射到宿主机端口，因此无法从宿主机直接连接。
- 作为替代，已在宿主机安装 `postgresql` 和 `redis-server` 并创建数据库 `findx`、用户 `findx_user`。
- 如果后续 eastmind 项目把 `5432`/`6379` 映射到宿主机，可把 `.env` 切回 `localhost:5432` / `localhost:6379`。
- 连接串：`postgresql+asyncpg://findx_user:findx_password@localhost:5432/findx`、`redis://localhost:6379/0`。

### 11.6 前端路由与 API 代理

- Next.js 15 App Router，国际化 `next-intl@4`。
- `next.config.ts` 中配置了 `rewrites`：前端 `/api/:path*` → 后端 `http://127.0.0.1:8006/api/:path*`。
- 部署时 Nginx 会把 `/api/` 直接反代到后端，无需经过 Next.js。

## 12. 扩展方向

- 引入 Alembic 管理数据库迁移。
- 用 Redis Pub/Sub 支持多实例 WebSocket（当前为单进程内存房间）。
- 增加更多 MiniMax 生成素材与音效。
- 引入更复杂的 ELO 与段位算法。
- 支持 Agent  tournaments / 杯赛。
