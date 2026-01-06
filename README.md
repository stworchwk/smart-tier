# smart-tier

> Smart tier-based model routing with automatic cost optimization for AI development workflows

## 💡 The Idea

**MCP Model Optimizer** คือ MCP Server ที่ออกแบบมาเพื่อแก้ปัญหาการใช้งาน AI models หลายๆ ตัวใน workflow เดียว:

### ปัญหาที่แก้ไข

| ปัญหา | สาเหตุ | วิธีแก้ |
|--------|--------|---------|
| **ใช้ Haiku ทุกงาน** | ประหยัดแต่ไม่มีประสิทธิภาพ | Auto-escalate เมื่อจำเป็น |
| **ใช้ Opus ทุกงาน** | แพงเกินไป เสียตังค์ฟรี | Route ไป tier ที่เหมาะสมกับงาน |
| **จำเป็นต้อง switch ด้วยตัวเอง** | ไม่มี automation | Auto-classify task แล้ว switch |
| **ไม่รู้ว่าค่าใช้จ่ายเท่าไหร่** | ไม่มี tracking | Real-time cost tracking |

### แนวคิดหลัก

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Model Optimizer                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Task Input ──► Classify ──► Route ──► Appropriate Tier    │
│        │            │              │            │            │
│        │            ▼              ▼            ▼            │
│        │    ┌─────────────┐  ┌─────────┐  ┌─────────┐      │
│        │    │  Keywords   │  │ Memory  │  │  Error  │      │
│        │    │  Patterns   │  │  Learn  │  │ Escalate │      │
│        │    └─────────────┘  └─────────┘  └─────────┘      │
│        │                                                 │    │
│        ▼                                                 │    │
│   ┌─────────────────────────────────────────────┐      │    │
│   │              2-Tier or 3-Tier               │      │    │
│   │  ┌────────┐  ┌────────┐  ┌────────┐       │      │    │
│   │  │ Tier 1 │  │ Tier 2 │  │ Tier 3 │       │      │    │
│   │  │ Fast   │  │ Balanced│  │ Smart  │       │      │    │
│   │  │ Cheap  │  │  Mid   │  │ Premium│       │      │    │
│   │  └────────┘  └────────┘  └────────┘       │      │    │
│   └─────────────────────────────────────────────┘      │    │
│                                                 │        │    │
│   Cost Tracking ────────────────────────────────┘        │    │
│   Budget Alerts ─────────────────────────────────┘       │    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 ใครควรใช้

### เหมาะสำหรับ

| ผู้ใช้ | เหมาะทำไม |
|--------|-------------|
| **AI Power Users** | ใช้ AI ทุกวัน ต้องการประสิทธิภาพสูงสุด |
| **Developers** | Code review, implementation, debugging ด้วย AI |
| **Teams with Budget** | มี budget limit ต้องการ optimize การใช้งาน |
| **Claude Code Users** | ใช้ Claude Code เป็นหลัก ต้องการ automation |
| **Multi-Model Users** | ใช้ทั้ง Anthropic และ ZhipuAI |

### อาจไม่เหมาะสำหรับ

| กรณี | เหตุผล |
|-------|---------|
| ใช้ AI น้อยกว่า 10 ครั้ง/วัน | Overkill ไป |
| ไม่มี budget constraints | Auto-routing อาจรบกวน |
| ต้องการความเรียบง่ายสุด | Configuration ค่อนข้างซับซ้อน |
| ใช้ provider อื่นนอกจาก Anthropic/Zhipu | ต้อง extend code เอง |

## 📥 การติดตั้ง

### Prerequisites

- Node.js >= 18
- npm หรือ pnpm หรือ yarn
- Anthropic API Key (จำเป็น)
- ZhipuAI API Key (ตัวเลือก)

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/your-username/smart-tier.git
cd smart-tier

# Install dependencies
npm install

# Build project
npm run build
```

### Step 2: Environment Variables

สร้างไฟล์ `.env`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional (สำหรับ ZhipuAI GLM models)
ZHIPU_API_KEY=xxxxx

# Optional (ปิด emoji output สำหรับ terminal ที่ไม่รองรับ)
NO_COLOR=1

# Optional (กำหนด path config)
CONFIG_PATH=./config
DATA_PATH=./data
```

### Step 3: Configuration

แก้ไข `config/providers.yaml`:

```yaml
providers:
  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
    models:
      haiku:
        id: "claude-3-haiku-20240307"
        input_cost_per_mtok: 0.25
        output_cost_per_mtok: 1.25
      sonnet:
        id: "claude-sonnet-4-20250514"
        input_cost_per_mtok: 3.0
        output_cost_per_mtok: 15.0
      opus:
        id: "claude-opus-4-5-20251101"
        input_cost_per_mtok: 15.0
        output_cost_per_mtok: 75.0

defaults:
  provider: "anthropic"
  strategy: "2-tier"  # หรือ "3-tier"
  tier_models:
    2-tier:
      primary: "anthropic:sonnet"
      critical: "anthropic:opus"
    3-tier:
      tier1: "anthropic:haiku"
      tier2: "anthropic:sonnet"
      tier3: "anthropic:opus"
```

แก้ไข `config/rules.yaml`:

```yaml
auto_upgrade_rules:
  keyword_rules:
    - name: "architecture_keywords"
      patterns: ["architecture", "design decision", "system design"]
      target_tier:
        2-tier: "critical"
        3-tier: "tier3"
      priority: 100

budget:
  monthly_limit_usd: 100.0
  alert_thresholds:
    - percent: 50
      action: "log_warning"
    - percent: 80
      action: "notify_user"
    - percent: 95
      action: "require_confirmation"
    - percent: 100
      action: "block_high_tier"
```

### Step 4: Claude Code Integration

เพิ่มใน `~/.claude.json` (หรือ project's `.mcp.json`):

```json
{
  "mcpServers": {
    "smart-tier": {
      "command": "node",
      "args": ["~/smart-tier/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "CONFIG_PATH": "~/smart-tier/config",
        "DATA_PATH": "~/smart-tier/data"
      }
    }
  }
}
```

## 🚀 วิธีใช้งาน

### Available Tools

#### 1. `orchestrate` - หัวใจหลักของระบบ

Classify task และ route ไป tier ที่เหมาะสม:

```typescript
// Auto-classify
orchestrate({
  task: "Review this architecture and suggest improvements"
})
// → Routes to: critical/tier3

// Force specific tier
orchestrate({
  task: "List files in current directory",
  force_tier: "tier1"
})
// → Routes to: tier1 (forced)
```

#### 2. `switch_tier` - เปลี่ยน tier ด้วยตัวเอง

```typescript
switch_tier({
  tier: "critical",
  reason: "Need deep analysis for security review"
})
```

#### 3. `set_auto_mode` - เปิด/ปิด auto-selection

```typescript
set_auto_mode({
  enabled: true,
  strategy: "3-tier"
})
```

#### 4. `get_status` - ดูสถานะปัจจุบัน

```typescript
get_status({
  detailed: true
})
// Returns: current tier, model, usage, costs, budget status
```

#### 5. `set_budget` - ตั้งค่า budget

```typescript
set_budget({
  monthly_limit_usd: 50,
  alert_threshold_percent: 75
})
```

### Workflow แนะนำ

```
┌─────────────────────────────────────────────────────────────┐
│                     Typical Workflow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Start with auto_mode = true (default)                   │
│     → ระบบจะ auto-classify และ switch tier               │
│                                                              │
│  2. Use orchestrate() for important tasks                   │
│     → ระบบจะ analyze และ route ไป tier ที่เหมาะสม     │
│                                                              │
│  3. Check get_status() periodically                         │
│     → monitor budget และ usage                             │
│                                                              │
│  4. Override with switch_tier() when needed                 │
│     → สำหรับ edge cases ที่ระบบไม่เข้าใจ              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## ⚖️ ข้อดี vs ข้อเสีย

### ✅ ข้อดี

| ด้าน | รายละเอียด |
|-------|-------------|
| **Cost Optimization** | ประหยัด 30-70% เมื่อเทียบกับการใช้ tier สูงสุดตลอด |
| **Automation** | ไม่ต้อง switch tier เอง ระบบทำให้ |
| **Smart Routing** | จดจำ pattern จากอดีต ยิ่งใช้ยิ่งฉลาด |
| **Budget Control** | แจ้งเตือนก่อนเกิน budget สามารถ block ได้ |
| **Multi-Provider** | รองรับทั้ง Anthropic และ ZhipuAI |
| **Type-Safe** | TypeScript strict mode + Zod validation |

### ❌ ข้อเสีย

| ด้าน | รายละเอียด | วิธีแก้ |
|-------|-------------|---------|
| **Setup Complexity** | Config หลายไฟล์ ยุ่งยาก | ใช้ default config |
| **Cold Start** | ยังไม่มี memory data | ใช้ keyword rules ช่วย |
| **False Classification** | อาจ classify ผิด | Force tier ได้ |
| **Additional Latency** | เพิ่ม latency เล็กน้อย | ~10-50ms |
| **Learning Curve** | ต้องเข้าใจ tier system | อ่าน docs นี้ |

## 🏗️ Architecture

```
mcp-model-optimizer/
├── config/                 # Configuration files
│   ├── providers.yaml      # Model & tier config
│   └── rules.yaml          # Auto-upgrade rules & budget
├── data/                   # Runtime data
│   └── usage.json          # Cost tracking data
├── src/
│   ├── errors/            # Custom error types
│   ├── config/            # Config loader & schema
│   ├── providers/         # Provider implementations
│   ├── rules/             # Rule engine
│   ├── tracking/          # Cost & memory tracking
│   ├── tools/             # MCP tool handlers
│   ├── utils/             # Utilities (formatter, etc.)
│   └── server.ts          # MCP server setup
└── dist/                  # Compiled output
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| `RuleEngine` | Classify tasks และ determine target tier |
| `CostTracker` | Track token usage, costs, budget status |
| `ConversationMemoryTracker` | Learn from past task patterns |
| `ProviderFactory` | Lazy-initialize provider instances |
| `Formatter` | Handle emoji/text output formatting |

## 📊 Tier Strategies

### 2-Tier (Simple)

| Tier | Model | Cost/1M tokens | Use Case |
|------|-------|----------------|----------|
| primary | Sonnet | $3/$15 | Daily coding, debugging |
| critical | Opus | $15/$75 | Architecture, security |

### 3-Tier (Granular)

| Tier | Model | Cost/1M tokens | Use Case |
|------|-------|----------------|----------|
| tier1 | Haiku | $0.25/$1.25 | Quick queries, exploration |
| tier2 | Sonnet | $3/$15 | Implementation, testing |
| tier3 | Opus | $15/$75 | Complex reasoning, design |

### When to use which?

- **2-Tier**: เริ่มต้นด้วยอันนี้ ง่าย ชัดเจน
- **3-Tier**: เมื่อต้องการ granular control มากขึ้น

## 💡 Best Practices

### 1. Start Simple

```yaml
# เริ่มด้วย 2-tier
strategy: "2-tier"
monthly_limit_usd: 50
```

### 2. Gradually Optimize

```yaml
# พอเข้าใจแล้วค่อยเปลี่ยนเป็น 3-tier
strategy: "3-tier"
```

### 3. Monitor Usage

```typescript
// เช็คทุกสัปดาห์
get_status({ detailed: true })
```

### 4. Customize Rules

```yaml
# เพิ่ม keyword patterns ของคุณเอง
keyword_rules:
  - name: "my_security_tasks"
    patterns: ["penetration test", "audit"]
    target_tier:
      2-tier: "critical"
    priority: 95
```

## 🔧 Troubleshooting

### Problem: Classification ผิด

```typescript
// Solution: Force tier ชั่วคราว
orchestrate({
  task: "...",
  force_tier: "critical"
})
```

### Problem: Budget เกินเร็วไป

```yaml
# Solution: ปรับ tier mappings
tier_models:
  2-tier:
    primary: "anthropic:haiku"  # เปลี่ยนจาก sonnet
```

### Problem: NO_COLOR ไม่ทำงาน

```bash
# Solution: ตั้งใน env ที่เรียก MCP
export NO_COLOR=1
```

## 📈 Roadmap

- [ ] Web Dashboard สำหรับ monitoring
- [ ] Support OpenAI models
- [ ] Custom rule builder UI
- [ ] Export usage reports (CSV/JSON)
- [ ] Slack/Discord notifications for budget alerts

## 🤝 Contributing

Contributions ยินดีต้อนรับ!

1. Fork [your-username/smart-tier](https://github.com/your-username/smart-tier)
2. Create feature branch
3. Make changes
4. Add tests
5. Submit PR

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [GitHub Repository](https://github.com/your-username/smart-tier)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [ZhipuAI GLM API](https://open.bigmodel.cn/)

---

Made with ❤️ by [your-username](https://github.com/your-username) for AI power users who want smart, cost-effective model routing
