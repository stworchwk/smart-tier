# MCP Model Optimizer Server - Implementation Plan

## Overview

สร้าง MCP Server สำหรับ optimize การใช้งาน AI models หลายระดับ (tier) เพื่อ balance ระหว่าง cost และ quality

**Location**: `C:\Users\stwor\mcp-model-optimizer\`
**Type**: Standalone package (reusable across projects)

---

## Features

### Core Features
- [x] Multi-model provider support (Anthropic, ZhipuAI, extensible)
- [x] 2-Tier strategy (primary/critical)
- [x] 3-Tier strategy (tier1/tier2/tier3)
- [x] Auto-upgrade rules (keyword-based, error escalation)
- [x] Cost tracking & budget management
- [x] Conversation memory for smarter auto-upgrade

### MCP Tools
| Tool | Description |
|------|-------------|
| `switch_tier` | Switch to specific tier (primary/critical/tier1-3) |
| `set_auto_mode` | Enable/disable auto model selection |
| `get_status` | Get current model, usage stats, costs |
| `orchestrate` | Classify task and route to appropriate tier |
| `set_budget` | Configure monthly budget and alerts |

---

## Project Structure

```
C:\Users\stwor\mcp-model-optimizer\
├── package.json
├── tsconfig.json
├── .env.example
├── config/
│   ├── providers.yaml      # Provider & model definitions
│   ├── strategies.yaml     # Tier strategy configs
│   └── rules.yaml          # Auto-upgrade rules
├── src/
│   ├── index.ts            # Entry point
│   ├── server.ts           # MCP server setup
│   ├── tools/
│   │   ├── index.ts        # Tool registration
│   │   ├── switch-tier.ts
│   │   ├── auto-mode.ts
│   │   ├── status.ts
│   │   └── orchestrate.ts
│   ├── providers/
│   │   ├── index.ts        # Provider factory
│   │   ├── base.provider.ts
│   │   ├── anthropic.provider.ts
│   │   └── zhipu.provider.ts
│   ├── strategies/
│   │   ├── index.ts
│   │   ├── two-tier.ts
│   │   └── three-tier.ts
│   ├── rules/
│   │   ├── index.ts
│   │   └── rule-engine.ts
│   ├── tracking/
│   │   ├── cost-tracker.ts
│   │   └── memory.ts       # Conversation memory
│   ├── config/
│   │   ├── loader.ts
│   │   └── schema.ts
│   └── types/
│       └── index.ts
├── data/
│   ├── usage.json          # Persisted usage data
│   └── memory.json         # Conversation memory
└── tests/
    └── *.test.ts
```

---

## Implementation Phases

### Phase 1: Foundation
**Files to create:**
- `package.json` - dependencies
- `tsconfig.json` - TypeScript config
- `src/index.ts` - entry point
- `src/server.ts` - MCP server setup
- `src/types/index.ts` - type definitions
- `src/config/loader.ts` - YAML config loader
- `src/config/schema.ts` - Zod validation schemas

**Dependencies:**
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "@anthropic-ai/sdk": "^0.35.0",
  "zod": "^3.25.0",
  "yaml": "^2.3.0",
  "dotenv": "^16.4.0"
}
```

### Phase 2: Provider System
**Files to create:**
- `src/providers/base.provider.ts` - abstract interface
- `src/providers/anthropic.provider.ts` - Claude API
- `src/providers/zhipu.provider.ts` - GLM API
- `src/providers/index.ts` - factory
- `config/providers.yaml` - provider configs

**Key Interface:**
```typescript
abstract class BaseProvider {
  abstract complete(params: CompleteParams): Promise<ModelResponse>;
  calculateCost(model: string, tokens: Usage): number;
}
```

### Phase 3: Tier Strategies
**Files to create:**
- `src/strategies/two-tier.ts`
- `src/strategies/three-tier.ts`
- `config/strategies.yaml`

**Key Logic:**
- 2-Tier: primary (Sonnet) + critical (Opus)
- 3-Tier: tier1 (Haiku) + tier2 (Sonnet) + tier3 (Opus)

### Phase 4: Rule Engine
**Files to create:**
- `src/rules/rule-engine.ts`
- `config/rules.yaml`

**Auto-Upgrade Rules:**
```yaml
keyword_rules:
  - patterns: ["architecture", "design decision"]
    target: critical/tier3
  - patterns: ["explore", "search", "find"]
    target: primary/tier1

error_escalation:
  threshold: 3
  window_minutes: 30
```

### Phase 5: Cost Tracking
**Files to create:**
- `src/tracking/cost-tracker.ts`
- `data/usage.json`

**Features:**
- Track tokens per model/tier
- Monthly budget with alerts
- Persistent storage

### Phase 6: Conversation Memory
**Files to create:**
- `src/tracking/memory.ts`
- `data/memory.json`

**Features:**
- Remember recent task patterns
- Smarter auto-upgrade based on context
- Session-based memory

### Phase 7: MCP Tools
**Files to create:**
- `src/tools/switch-tier.ts`
- `src/tools/auto-mode.ts`
- `src/tools/status.ts`
- `src/tools/orchestrate.ts`
- `src/tools/index.ts`

### Phase 8: Integration & Testing
**Files to create:**
- `tests/*.test.ts`
- `.env.example`
- `README.md`

**Claude Code Integration:**
```json
// ~/.claude.json
{
  "mcpServers": {
    "model-optimizer": {
      "command": "node",
      "args": ["C:/Users/stwor/mcp-model-optimizer/dist/index.js"]
    }
  }
}
```

---

## Configuration Files

### providers.yaml (default)
```yaml
providers:
  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
    models:
      haiku:
        id: "claude-3-haiku-20240307"
        input_cost: 0.25
        output_cost: 1.25
      sonnet:
        id: "claude-sonnet-4-20250514"
        input_cost: 3.0
        output_cost: 15.0
      opus:
        id: "claude-opus-4-5-20251101"
        input_cost: 5.0
        output_cost: 25.0

defaults:
  provider: "anthropic"
  strategy: "2-tier"
  tier_models:
    2-tier:
      primary: "anthropic:sonnet"
      critical: "anthropic:opus"
    3-tier:
      tier1: "anthropic:haiku"
      tier2: "anthropic:sonnet"
      tier3: "anthropic:opus"
```

---

## Estimated Effort

| Phase | Description | Files |
|-------|-------------|-------|
| 1 | Foundation | 7 |
| 2 | Provider System | 5 |
| 3 | Tier Strategies | 3 |
| 4 | Rule Engine | 2 |
| 5 | Cost Tracking | 2 |
| 6 | Conversation Memory | 2 |
| 7 | MCP Tools | 5 |
| 8 | Integration | 3 |
| **Total** | | **29 files** |

---

## Success Criteria

1. MCP server starts and connects via stdio
2. All 5 tools registered and callable
3. Can switch between 2-tier and 3-tier strategies
4. Auto-upgrade works based on keyword rules
5. Cost tracking persists across sessions
6. Conversation memory improves auto-upgrade decisions
7. Budget alerts trigger at configured thresholds
