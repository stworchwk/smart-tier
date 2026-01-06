# Claude Model Optimization Strategy

> **Purpose:** Optimize cost and quality by using the right model tier for each task phase.
> **Dual Mode:** Choose between Claude Code (built-in) or MCP Server (customizable) based on your environment.

---

## Quick Start: Choose Your Mode

```
┌─────────────────────────────────────────────────────────────┐
│                 Which environment are you using?             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
   ┌─────────────────┐                 ┌─────────────────┐
   │   Claude Code   │                 │  MCP Server     │
   │   (Built-in)    │                 │  (Custom)       │
   │                 │                 │                 │
   │ Use Mode 1 ↓    │                 │ Use Mode 2 ↓    │
   │ 3-Tier System   │                 │ Flexible Config │
   └─────────────────┘                 └─────────────────┘
```

---

## MODE 1: Claude Code Only (Built-in)

### Model Tiers

| Tier | Model | Best For | Cost | Speed |
|------|-------|----------|------|-------|
| **Tier 1** | Haiku | Data gathering, exploration, simple extraction | $ | Fast |
| **Tier 2** | Sonnet | Balanced tasks, code generation, analysis | $$ | Medium |
| **Tier 3** | Opus 4.5 | Complex reasoning, architecture, critical decisions | $$$ | Slower |

### Built-in Commands

```bash
/model haiku    # Switch to Tier 1
/model sonnet   # Switch to Tier 2
/model opus     # Switch to Tier 3
```

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    What type of task?                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐        ┌──────────┐        ┌──────────┐
   │ Simple  │        │ Medium   │        │ Complex  │
   │ Task    │        │ Task     │        │ Task     │
   └────┬────┘        └────┬─────┘        └────┬─────┘
        │                  │                   │
        ▼                  ▼                   ▼
   Tier 1 Only         Tier 2 Only         Tier 1 + Tier 3

   Examples:          Examples:            Examples:
   - File search      - Code generation    - Architecture design
   - Pattern find     - Bug fixes          - Feature specification
   - Data extract     - Refactoring        - Complex planning
   - Grep/Glob        - Documentation      - Critical decisions
```

### Workflow: Haiku + Opus (Recommended)

**When to Use:**
- Large codebase exploration needed
- Feature specification & planning
- Cost is a concern
- Time is flexible (non-real-time)

```bash
# Step 1: Switch to Tier 1 (Haiku) for exploration
/model haiku

# Step 2: Explore codebase (Haiku is fast & cheap)
"Explore the storage module structure, find all entities,
 services, and API endpoints. List file paths and key patterns."

# Step 3: Copy/note the findings

# Step 4: Switch to Tier 3 (Opus) for deep work
/model opus

# Step 5: Use speckit with Haiku's context
/speckit.specify
# Paste context from Haiku's exploration
# Opus will use this to create specification

# Continue with other phases
/speckit.clarify
/speckit.plan
/speckit.tasks
```

### Workflow: Sonnet Only (Balanced)

**When to Use:**
- Standard development tasks
- Code generation
- Bug fixes
- Documentation

```bash
/model sonnet

# Sonnet handles most tasks well:
# - Code writing
# - Refactoring
# - Analysis
# - Documentation
```

### Model per Phase (Advanced)

| Phase | Tier | Model | Why |
|-------|------|-------|-----|
| **Explore** | Tier 1 | Haiku | Fast file scanning, cheap |
| **Specify** | Tier 3 | Opus 4.5 | Architectural decisions critical |
| **Clarify** | Tier 2 | Sonnet | Good enough for questions |
| **Plan** | Tier 3 | Opus 4.5 | Architecture & trade-offs |
| **Tasks** | Tier 2 | Sonnet | Task generation is straightforward |
| **Implement** | Tier 2 | Sonnet | Code generation |

```bash
# Phase 1: Explore (Haiku)
/model haiku
"Explore the branding-account module. Find all storage-related
 files, patterns, and conventions."

# Phase 2: Specify (Opus)
/model opus
/speckit.specify
[Paste Haiku findings]
"Create specification for adding storage config to branding-config"

# Phase 3: Clarify (Sonnet)
/model sonnet
/speckit.clarify

# Phase 4: Plan (Opus)
/model opus
/speckit.plan

# Phase 5: Tasks (Sonnet)
/model sonnet
/speckit.tasks

# Phase 6: Implement (Sonnet)
/model sonnet
"Implement the tasks from the plan"
```

---

## MODE 2: MCP Server (Customizable)

### Configuration Options

Your MCP server can be configured for different strategies based on your needs.

### Option A: 2-Tier Strategy (Simpler)

**Best for:** Most users, simplified workflow, good balance

```yaml
# mcp-model-config.yml
models:
  primary:
    id: "glm-4.7"
    provider: "zhipu"
    cost_tier: 2
    use_for: [read, write, analyze, fix, explore]

  critical:
    id: "opus-4.5"
    provider: "anthropic"
    cost_tier: 3
    use_for: [architecture, decisions, complex_reasoning]

commands:
  /primary    # Switch to primary model (GLM 4.7)
  /critical   # Switch to critical model (Opus 4.5)

auto_upgrade:
  enabled: true
  rules:
    - if: "task contains 'architecture' or 'design decision'"
      use: "critical"
    - if: "error_count > 3 and not resolved"
      use: "critical"
```

**Workflow:**

```bash
# Use GLM 4.7 for 90% of tasks
/primary
"Explore the storage module, find all entities and services"

# Switch to Opus 4.5 only for critical decisions
/critical
"Design the architecture for multi-provider storage system"
```

### Option B: 3-Tier Strategy (Cost Optimized)

**Best for:** Maximum cost savings, large-scale projects

```yaml
# mcp-model-config.yml
models:
  tier1:
    id: "glm-4.6"
    provider: "zhipu"
    cost_tier: 1
    use_for: [explore, search, extract, gather]

  tier2:
    id: "glm-4.7"
    provider: "zhipu"
    cost_tier: 2
    use_for: [write, analyze, fix, implement]

  tier3:
    id: "opus-4.5"
    provider: "anthropic"
    cost_tier: 3
    use_for: [architecture, decisions, plan]

commands:
  /tier1      # Switch to tier 1 (GLM 4.6)
  /tier2      # Switch to tier 2 (GLM 4.7)
  /tier3      # Switch to tier 3 (Opus 4.5)

auto_upgrade:
  enabled: true
  rules:
    - if: "task == 'explore' or 'search' or 'extract'"
      use: "tier1"
    - if: "task contains 'implement' or 'write'"
      use: "tier2"
    - if: "task contains 'architecture' or 'critical'"
      use: "tier3"
```

**Workflow:**

```bash
# Phase 1: Explore with Tier 1 (GLM 4.6)
/tier1
"Find all storage-related files in the codebase"

# Phase 2: Analyze with Tier 2 (GLM 4.7)
/tier2
"Analyze the storage implementation patterns"

# Phase 3: Design with Tier 3 (Opus 4.5)
/tier3
"Design the migration strategy from DATABASE to S3"

# Phase 4: Implement with Tier 2 (GLM 4.7)
/tier2
"Implement the migration service"
```

### Option C: Claude-Only (No GLM)

**Best for:** Claude-only users, consistent quality

```yaml
# mcp-model-config.yml
models:
  tier1:
    id: "claude-haiku"
    provider: "anthropic"
    cost_tier: 1
    use_for: [explore, search, extract]

  tier2:
    id: "claude-sonnet"
    provider: "anthropic"
    cost_tier: 2
    use_for: [write, analyze, implement]

  tier3:
    id: "claude-opus-4.5"
    provider: "anthropic"
    cost_tier: 3
    use_for: [architecture, decisions, plan]
```

---

## Comparison: Mode 1 vs Mode 2

| Aspect | Mode 1 (Claude Code) | Mode 2 (MCP Server) |
|--------|---------------------|-------------------|
| **Setup** | Built-in, no config | Requires config file |
| **Models Available** | Claude only | Any model (GLM, Claude, etc.) |
| **Flexibility** | Fixed 3 tiers | Choose 2 or 3 tiers |
| **Cost Optimization** | Maximum (Haiku) | Good (GLM 4.6/4.7) |
| **Simplicity** | Medium | Configurable |
| **Best For** | Claude purists | Multi-model users |

## When to Use Each Mode

### Use Mode 1 (Claude Code) when:
- ✅ You only use Claude models
- ✅ You want maximum cost savings (Haiku is cheapest)
- ✅ You prefer built-in `/model` commands
- ✅ You don't want to configure MCP servers

### Use Mode 2 (MCP Server) when:
- ✅ You want to use GLM models
- ✅ You need flexible model configuration
- ✅ You want to customize auto-upgrade rules
- ✅ You work across multiple model providers

---

## Cost Analysis

### Claude Pricing (Mode 1)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Haiku | $0.25 | $1.25 |
| Sonnet | $3.00 | $15.00 |
| Opus 4.5 | $15.00 | $75.00 |

### GLM Pricing (Mode 2)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GLM 4.6 | ~$0.10-0.50 | ~$0.50-2.00 |
| GLM 4.7 | ~$1.00-2.00 | ~$5.00-10.00 |

### Example: Feature Specification (Storage Config)

**Mode 1: Claude (Haiku + Opus)**
```
Haiku exploration (50k input):    50k × $0.25/1M = $0.01
Haiku output (5k):                5k × $1.25/1M = $0.01
Opus specification (5k input):    5k × $15/1M = $0.08
Opus output (10k):                10k × $75/1M = $0.75
Total: $0.85 (43% savings vs Opus-only)
```

**Mode 2: MCP 2-Tier (GLM 4.7 + Opus)**
```
GLM 4.7 explore (50k input):      50k × $1.50/1M = $0.075
GLM 4.7 output (5k):              5k × $7.50/1M = $0.038
Opus specification (5k input):    5k × $15/1M = $0.08
Opus output (10k):                10k × $75/1M = $0.75
Total: $0.92 (39% savings vs Opus-only)
```

**Mode 2: MCP 3-Tier (GLM 4.6 + Opus)**
```
GLM 4.6 explore (50k input):      50k × $0.30/1M = $0.015
GLM 4.6 output (5k):              5k × $1.50/1M = $0.008
Opus specification (5k input):    5k × $15/1M = $0.08
Opus output (10k):                10k × $75/1M = $0.75
Total: $0.85 (43% savings vs Opus-only)
```

**Opus Only (Baseline)**
```
Opus exploration (50k input):     50k × $15/1M = $0.75
Opus specification (10k output):  10k × $75/1M = $0.75
Total: $1.50
```

### Summary

| Strategy | Cost | Savings | Complexity |
|----------|------|---------|------------|
| Opus Only | $1.50 | 0% | Low |
| Mode 1: Haiku + Opus | $0.85 | 43% | Medium |
| Mode 2: 2-Tier (GLM 4.7) | $0.92 | 39% | Low |
| Mode 2: 3-Tier (GLM 4.6) | $0.85 | 43% | Medium |

---

## Quick Start Templates

### Template 1: Claude Code Only (Mode 1)

```bash
# For new feature specification:

# 1. Explore with Tier 1 (Haiku)
/model haiku
"Explore [module]. Find all entities, services, controllers,
 and patterns. Format as structured list."

# 2. Copy findings

# 3. Specify with Tier 3 (Opus)
/model opus
/speckit.specify
[Paste Haiku findings]
"Create specification for [feature]"

# 4. Plan with Tier 3 (Opus)
/model opus
/speckit.plan

# 5. Generate tasks with Tier 2 (Sonnet)
/model sonnet
/speckit.tasks

# 6. Implement with Tier 2 (Sonnet)
/model sonnet
"Implement task 1: [description]"
```

### Template 2: MCP 2-Tier (Mode 2, Option A)

```bash
# Config: primary=GLM 4.7, critical=Opus 4.5

# 1. Use primary for everything (GLM 4.7)
/primary
"Explore [module]. Find all entities, services, controllers,
 and patterns. Format as structured list."

# 2. Continue with primary (GLM 4.7)
/primary
"Create specification for [feature] based on:
[Paste exploration findings]"

# 3. Use critical only for architecture (Opus 4.5)
/critical
"Review the specification and design the system architecture.
 Consider scalability, security, and maintainability."

# 4. Back to primary for implementation (GLM 4.7)
/primary
"Implement the tasks from the plan"
```

### Template 3: MCP 3-Tier (Mode 2, Option B)

```bash
# Config: tier1=GLM 4.6, tier2=GLM 4.7, tier3=Opus 4.5

# 1. Explore with Tier 1 (GLM 4.6)
/tier1
"Find all storage-related files in the codebase"

# 2. Analyze with Tier 2 (GLM 4.7)
/tier2
"Analyze the storage implementation patterns"

# 3. Design with Tier 3 (Opus 4.5)
/tier3
"Design the migration strategy"

# 4. Implement with Tier 2 (GLM 4.7)
/tier2
"Implement the migration service"
```

---

## MCP Server Configuration Example

### Full Config File

```yaml
# ~/.mcp-model-config.yml
server:
  name: "multi-model-optimization"
  version: "1.0.0"

models:
  primary:
    id: "glm-4.7"
    provider: "zhipu"
    api_endpoint: "https://api.zhipu.ai/v4/chat"
    api_key_env: "ZHIPU_API_KEY"
    cost_tier: 2
    use_for:
      - "code_writing"
      - "analysis"
      - "bug_fixes"
      - "documentation"
      - "exploration"
    max_tokens: 128000
    temperature: 0.7

  critical:
    id: "opus-4.5"
    provider: "anthropic"
    api_endpoint: "https://api.anthropic.com/v1/messages"
    api_key_env: "ANTHROPIC_API_KEY"
    cost_tier: 3
    use_for:
      - "architecture_design"
      - "critical_decisions"
      - "complex_reasoning"
      - "system_planning"
    max_tokens: 200000
    temperature: 0.5

  # Optional: Add tier1 for 3-tier strategy
  tier1:
    id: "glm-4.6"
    provider: "zhipu"
    api_endpoint: "https://api.zhipu.ai/v4/chat"
    api_key_env: "ZHIPU_API_KEY"
    cost_tier: 1
    use_for:
      - "file_search"
      - "pattern_extraction"
      - "data_gathering"
    max_tokens: 128000
    temperature: 0.3

strategy:
  mode: "2-tier"  # Options: "2-tier" or "3-tier"
  default_model: "primary"
  auto_upgrade:
    enabled: true
    confidence_threshold: 0.7
    rules:
      - trigger:
          task_patterns: ["architecture", "design decision", "system design"]
          error_count: 3
        switch_to: "critical"
          reason: "Complex reasoning required"

      - trigger:
          task_patterns: ["explore", "search", "find all", "list"]
        switch_to: "tier1"
          reason: "Data gathering task"

commands:
  - name: "/primary"
    description: "Switch to primary model (GLM 4.7)"
    action: "switch_model"
    target: "primary"

  - name: "/critical"
    description: "Switch to critical model (Opus 4.5)"
    action: "switch_model"
    target: "critical"

  - name: "/tier1"
    description: "Switch to tier 1 model (GLM 4.6)"
    action: "switch_model"
    target: "tier1"

  - name: "/auto"
    description: "Enable auto model selection"
    action: "enable_auto_upgrade"

monitoring:
  track_costs: true
  log_switches: true
  monthly_budget:
    enabled: true
    limit: 100  # USD
    alert_at: 80  # USD
```

---

## Best Practices

### For Mode 1 (Claude Code)

**DO ✓**
- Use Haiku for file exploration and pattern finding
- Use Sonnet for most implementation work
- Use Opus only for architecture and critical decisions
- Copy context when switching models

**DON'T ✗**
- Don't use Opus for simple file searches
- Don't use Haiku for complex reasoning
- Don't skip the Sonnet middle layer for implementation

### For Mode 2 (MCP Server)

**DO ✓**
- Start with 2-tier strategy (simpler)
- Enable auto-upgrade for smart model selection
- Monitor costs with built-in tracking
- Set monthly budget limits

**DON'T ✗**
- Don't configure too many models (keep it 2-3 max)
- Don't disable auto-upgrade unless you have manual workflow
- Don't forget to set API keys in environment variables

---

## Troubleshooting

### Mode 1 Issues

**Issue: `/model` command not working**
```
Solution:
1. Ensure you're using Claude Code CLI
2. Check command is at start of message
3. Try "/model list" to see available models
```

**Issue: Context lost when switching**
```
Solution:
1. Always copy key findings before switching
2. Use "Based on previous exploration..." prompts
3. Reference previous model's output explicitly
```

### Mode 2 Issues

**Issue: MCP server not loading config**
```
Solution:
1. Check config file path: ~/.mcp-model-config.yml
2. Validate YAML syntax
3. Check API keys in environment variables
4. Review server logs for errors
```

**Issue: Auto-upgrade not working**
```
Solution:
1. Verify auto_upgrade.enabled: true
2. Check task_patterns match your prompts
3. Review confidence_threshold setting
4. Test with manual /critical command first
```

**Issue: Costs higher than expected**
```
Solution:
1. Enable track_costs: true
2. Review log_switches output
3. Add more specific task_patterns
4. Consider switching to 3-tier strategy
```

---

## Summary

### Mode 1: Claude Code (Built-in)
- **3 Tiers:** Haiku → Sonnet → Opus 4.5
- **Commands:** `/model haiku|sonnet|opus`
- **Best For:** Claude purists, maximum savings
- **Savings:** 40-50% vs Opus-only

### Mode 2: MCP Server (Custom)
- **2-Tier:** GLM 4.7 + Opus 4.5 (Simpler)
- **3-Tier:** GLM 4.6 + GLM 4.7 + Opus 4.5 (Cost optimized)
- **Config:** YAML file with flexible options
- **Best For:** Multi-model users, customization
- **Savings:** 40-45% vs Opus-only

### Recommendation

| User Type | Recommended Mode | Strategy |
|-----------|-----------------|----------|
| Claude-only users | Mode 1 | Haiku + Opus |
| GLM + Claude users | Mode 2 | 2-Tier (GLM 4.7 + Opus) |
| Cost-sensitive | Mode 1 or Mode 2 | 3-Tier with GLM 4.6 |
| Simplicity-focused | Mode 2 | 2-Tier (GLM 4.7 + Opus) |

**Key Decision Tree:**
```
Do you use GLM models?
├── No → Use Mode 1 (Claude Code built-in)
└── Yes → Use Mode 2 (MCP Server)
    ├── Want simplicity? → 2-Tier (GLM 4.7 + Opus)
    └── Want max savings? → 3-Tier (GLM 4.6 + GLM 4.7 + Opus)
```
