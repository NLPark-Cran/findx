# FindX 大作业技术报告素材

> 本 Markdown 是为「项目报告撰写 Agent」准备的素材包，包含关键技术应用、项目结构、核心代码片段与部署信息。也可直接用于生成展示 PPT。
>
> 在线演示：https://findx.hub.tt2.li  
> 展示 PPT：https://findx.hub.tt2.li/showcase  
> 仓库：https://github.com/NLPark-Cran/findx

---

## 一、项目概述

**找猹 / FindX** 是一款面向中文网络评论场景的 AI 逻辑谬误对战游戏。玩家需要在评论区中识别对手言论里的逻辑谬误，选择对应的「逻辑武器」进行反驳，最终击败杠精。项目覆盖三项核心能力：

1. **文本情感分析**：利用大语言模型对评论进行多维度情绪识别，生成情绪雷达图。
2. **逻辑谬误检测与裁判**：让 LLM 判断评论中含有的谬误类型，并给出理由。
3. **数据可视化与对战反馈**：通过雷达图、伤害/连击/分数面板、对手反应 OS 等形式实时呈现对战数据。

---

## 二、关键技术应用

### 2.1 文本情感分析

**应用位置**：`backend/app/services/llm_client.py` → `analyze_comment`  
**技术说明**：

- 通过 TokenDance（兼容 OpenAI 接口）调用 `qwen3.7-max` 模型。
- 要求模型以 JSON 输出 8 维情绪得分：愤怒、讽刺、恐惧、厌恶、喜悦、悲伤、惊讶、轻蔑。
- 同时识别评论是否包含逻辑谬误，并给出置信度与解释。

**输出示例**：

```json
{
  "emotion": {
    "anger": 0.75,
    "sarcasm": 0.60,
    "fear": 0.10,
    "disgust": 0.55,
    "joy": 0.05,
    "sadness": 0.20,
    "surprise": 0.15,
    "contempt": 0.80
  },
  "has_fallacy": true,
  "fallacy_types": ["诉诸人身"],
  "confidence": 0.92,
  "explanation": "...",
  "counter_suggestion": "..."
}
```

**前端可视化**：`frontend/components/EmotionRadar.tsx` 使用 ECharts 雷达图将 8 维情绪数据可视化，并自动适配浅色/深色主题。

### 2.2 数据分析与可视化呈现

**应用场景**：

| 功能 | 技术/组件 | 说明 |
|------|----------|------|
| 情绪雷达图 | ECharts + React | 8 维情绪得分雷达图，主题色随 light/dark 切换 |
| 对战伤害计算 | `game_engine.py` | 基于命中分计算伤害、怒气、理智、连击 |
| 三项评分面板 | `battle/page.tsx` | 识谬分 / 器配分 / 反驳分可视化展示 |
| 进度条与血条 | shadcn Progress | 敌方 HP 可视化 |
| 数据面板 | `dashboard/page.tsx` | 关卡数、话题数、最高难度统计卡片 |
| 对手反应 OS | `OpponentReaction.tsx` | 内心独白 + 情绪变化标签 |

**伤害计算核心逻辑**：

```python
def compute_battle_result(hit_score: float, combo: int = 0, ...):
    hit_score = max(0, min(100, hit_score))
    base_damage = hit_score * 0.8
    combo_bonus = min(combo * 5, 25)
    total_damage = base_damage + combo_bonus
    # 根据命中分阈值更新怒气、理智与连击
```

---

## 三、项目结构与目录说明

```
findx/
├── .env.example                 # 环境变量模板（数据库、Redis、API Key）
├── .gitignore
├── README.md                    # 项目 README
├── AGENTS.md                    # Agent 协作说明
├── REPORT.md                    # 本报告素材
├── ecosystem.config.js          # PM2 进程配置
├── nginx-findx.conf.example     # Nginx 配置示例
├── start.sh                     # 一键启动脚本
│
├── backend/                     # FastAPI 后端
│   ├── main.py                  # FastAPI 入口，配置 /api root_path
│   ├── requirements.txt         # Python 依赖
│   ├── app/
│   │   ├── config.py            # Pydantic Settings 配置
│   │   ├── api/                 # REST / WebSocket 路由
│   │   │   ├── sentiment.py     # /sentiment/analyze 情感分析
│   │   │   ├── fallacy.py       # /fallacy/evaluate 谬误裁判
│   │   │   ├── levels.py        # /levels 关卡数据
│   │   │   ├── game.py          # /game/submit-move, /game/finish
│   │   │   ├── pvp.py           # PvP WebSocket 房间
│   │   │   └── agent.py         # Agent 战士系统
│   │   ├── models/
│   │   │   └── db.py            # SQLAlchemy 2.0 async + PostgreSQL/Redis
│   │   ├── services/
│   │   │   ├── llm_client.py    # TokenDance LLM 调用、谬误/武器元数据
│   │   │   ├── game_engine.py   # 战斗数值计算
│   │   │   ├── sentiment_service.py
│   │   │   ├── fallacy_judge.py
│   │   │   ├── level_generator.py
│   │   │   ├── pvp_service.py
│   │   │   └── agent_service.py
│   │   └── data/
│   │       └── seed_comments.json
│
└── frontend/                    # Next.js 16 + React 19 前端
    ├── next.config.ts           # 配置 turbopack、API rewrite
    ├── package.json
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx           # 根布局：next-themes ThemeProvider
    │   ├── globals.css          # Tailwind v4 + Mercure 2.0 主题变量
    │   └── [locale]/            # 国际化路由（zh / en）
    │       ├── layout.tsx       # LocaleLayout + ClientIntlProvider
    │       ├── page.tsx         # 首页
    │       ├── battle/page.tsx  # 核心战斗页（识谬 → 选器 → 反驳）
    │       ├── arena/page.tsx   # PvP 房间页
    │       ├── pvp/page.tsx     # PvP WebSocket 对战
    │       ├── agent/page.tsx   # Agent 训练
    │       └── dashboard/page.tsx # 数据面板
    ├── components/
    │   ├── EmotionRadar.tsx     # ECharts 情绪雷达图
    │   ├── FallacyDetector.tsx  # 谬误多选卡片
    │   ├── WeaponHand.tsx       # 武器选择网格
    │   ├── OpponentReaction.tsx # 对手反应 OS
    │   ├── Navbar.tsx           # 顶部导航
    │   ├── ThemeToggle.tsx      # 主题切换
    │   ├── IntlProvider.tsx     # next-intl client provider
    │   └── ui/                  # shadcn/ui 组件
    ├── lib/
    │   ├── api.ts               # 统一 API 客户端
    │   ├── fallacies.ts         # 谬误元数据与标签函数
    │   ├── weapons.ts           # 武器元数据与标签函数
    │   └── utils.ts             # 工具函数
    ├── messages/
    │   ├── zh.json              # 中文文案
    │   └── en.json              # 英文文案
    ├── i18n/
    │   ├── request.ts           # next-intl 请求配置
    │   └── routing.ts           # 路由配置
    └── public/
        └── assets/              # AI 生成素材（敌方头像、英雄头像）
```

---

## 四、核心代码片段

### 4.1 文本情感分析 + 谬误检测（backend/app/services/llm_client.py）

```python
async def analyze_comment(text: str, language: str = "zh") -> dict[str, Any]:
    client = get_client()
    lang_name = "Chinese" if language == "zh" else "English"
    system_prompt = f"""You are an expert in Chinese online comments, emotion analysis, and logical fallacy detection.
Respond ONLY with a valid JSON object. ...

Output schema:
{{
  "emotion": {{ "anger": 0.0-1.0, "sarcasm": 0.0-1.0, ... }},
  "has_fallacy": true/false,
  "fallacy_types": ["fallacy name in {lang_name}"],
  "confidence": 0.0-1.0,
  "explanation": "...",
  "counter_suggestion": "..."
}}
"""
    response = await client.chat.completions.create(
        model=settings.tokendance_model,
        messages=[...],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1024,
    )
    return _extract_json(response.choices[0].message.content or "{}")
```

### 4.2 反驳质量裁判（backend/app/services/llm_client.py）

```python
async def evaluate_rebuttal(
    comment: str,
    fallacy_types: list[str],
    weapon_id: str,
    rebuttal: str,
    language: str = "zh",
    detected_fallacies: list[str] | None = None,
) -> dict[str, Any]:
    # Prompt 要求 LLM 输出：
    # fallacy_detection_score, weapon_match_score, rebuttal_score,
    # hit, hit_score, reason, improvement,
    # opponent_reaction: { inner_monologue, emotion_delta }
```

### 4.3 战斗数值计算（backend/app/services/game_engine.py）

```python
def compute_battle_result(hit_score: float, combo: int = 0, ...) -> dict[str, Any]:
    hit_score = max(0, min(100, hit_score))
    base_damage = hit_score * 0.8
    combo_bonus = min(combo * 5, 25)
    total_damage = base_damage + combo_bonus

    if hit_score >= 70:
        rage_increase = -10 if enemy_rage >= 10 else 0
        sanity_cost = 0
        combo_next = combo + 1
    elif hit_score >= 40:
        rage_increase = 5
        sanity_cost = 5
        combo_next = 0
    else:
        rage_increase = 15
        sanity_cost = 10
        combo_next = 0

    return {
        "damage": round(total_damage, 1),
        "enemy_rage_delta": round(rage_increase, 1),
        "sanity_cost": round(sanity_cost, 1),
        "combo_next": combo_next,
        "hit_score": round(hit_score, 1),
    }
```

### 4.4 情绪雷达图可视化（frontend/components/EmotionRadar.tsx）

```tsx
"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

const DIMS_ZH = ["愤怒", "讽刺", "恐惧", "厌恶", "喜悦", "悲伤", "惊讶", "轻蔑"];
const DIMS_EN = ["Anger", "Sarcasm", "Fear", "Disgust", "Joy", "Sadness", "Surprise", "Contempt"];

export function EmotionRadar({ emotion, language = "zh", className }: EmotionRadarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const dims = language === "zh" ? DIMS_ZH : DIMS_EN;
  const keys = ["anger", "sarcasm", "fear", "disgust", "joy", "sadness", "surprise", "contempt"];
  const values = keys.map((k) => emotion?.[k] ?? 0);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current);
    const isDark = document.documentElement.classList.contains("dark");
    chartInstance.current.setOption({
      radar: { indicator: dims.map((d) => ({ name: d, max: 1 })), radius: "65%", ... },
      series: [{ type: "radar", data: [{ value: values, name: "情绪画像", areaStyle: {...} }] }],
    });
  }, [emotion, language]);

  return <div ref={chartRef} className={className || "h-72 w-full"} />;
}
```

### 4.5 对战流程提交（frontend/app/[locale]/battle/page.tsx）

```tsx
const submitMove = async () => {
  if (!current || !selectedWeapon) return;
  setLoading(true);
  const data = await api.submitMove({
    comment: locale === "zh" ? current.text_cn : current.text_en,
    fallacy_types: current.fallacy_types,
    detected_fallacies: detectedFallacies.map((fid) => {
      const f = getFallacyById(fid);
      return f ? (locale === "zh" ? f.zh : f.en) : fid;
    }),
    weapon_id: selectedWeapon,
    rebuttal,
    combo,
    language: locale,
  });
  setResult(data);
  setEnemyHp((hp) => Math.max(0, hp - data.battle.damage));
  setScore((s) => s + Math.round(data.battle.damage));
  setCombo(data.battle.combo_next);
  setStep("result");
  setShowHint(true);
  setLoading(false);
};
```

---

## 五、部署与运行

- **后端**：FastAPI + Uvicorn，监听 `127.0.0.1:8006`，PostgreSQL 17 + Redis 7。
- **前端**：Next.js 16 + React 19 + Tailwind v4 + shadcn/ui，端口 `3006`。
- **进程管理**：PM2 `findx-backend` / `findx-frontend`。
- **反向代理**：Nginx 将 `/api/` 转发到后端，`/` 转发到前端；Certbot 自动 SSL。
- **线上地址**：https://findx.hub.tt2.li

---

## 六、可展示数据/效果

- 支持 12 种逻辑谬误、7 种逻辑武器。
- 中英双语界面与谬误/武器名称。
- 情绪雷达图 8 维可视化。
- 对战结果三项独立评分 + 伤害/连击/分数。
- 对手「内心戏」OS 反馈与情绪变化标签。
- 浅色/深色双主题（Mercure 2.0）。
- 单人闯关、实时 PvP、Agent 战士三种模式。

---

## 七、给报告撰写 Agent 的提示

1. 可以引用本报告中的目录结构、代码片段和效果数据。
2. 配图建议：情绪雷达图截图、战斗页截图、项目架构图、技术栈图。
3. 如需要生成 HTML PPT，可使用本仓库的 `frontend/public/showcase.html`（已部署到 https://findx.hub.tt2.li/showcase）。
