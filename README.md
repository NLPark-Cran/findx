# 找猹 / FindX

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> AI-powered logical fallacy battle game.  
> 一款“情绪雷达 + 逻辑武器”的中文网络评论对战游戏，支持单人闯关、实时 PvP 和 AgenTank 风格的 Agent 对战。

## 在线演示

https://findx.hub.tt2.li

## 技术亮点

- **Python 核心**：FastAPI + SQLAlchemy 2.0 async + PostgreSQL/Redis
- **文本情感分析**：TokenDance `qwen3.7-max` 输出多维度情绪雷达
- **逻辑谬误裁判**：同一个 LLM 识别谬误并评判玩家/Agent 反驳
- **实时 PvP**：WebSocket 对战房 + ELO 排行榜
- **Agent 模式**：Agent Key + 外部 AI 迭代策略，模拟/挑战真实对手
- **中英双语**：界面、谬误名称、解释全部支持 `中 / EN`
- **AI 生成素材**：MiniMax 图片/音乐/语音

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/NLPark-Cran/findx.git
cd findx

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 TOKENDANCE_API_KEY 和 MINIMAX_API_KEY

# 3. 启动后端
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8006 --reload

# 4. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 部署

```bash
sudo certbot --nginx -d findx.hub.tt2.li
sudo nginx -t && sudo systemctl reload nginx
```

详见 `AGENTS.md` 与 `nginx-findx.conf.example`。

## 许可

MIT License
