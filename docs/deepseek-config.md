# DeepSeek V4 + Claude Code Configuration

This project uses **DeepSeek** models routed through DeepSeek's Anthropic-compatible API, allowing Claude Code to run on DeepSeek V4 Pro / Flash.

## Why

DeepSeek V4 provides a powerful alternative to Anthropic's Claude models. Routing through the Anthropic-compatible API at `api.deepseek.com/anthropic` lets Claude Code talk to DeepSeek models with no tooling changes.

## Model IDs

| Model | API ID |
|---|---|
| DeepSeek V4 Pro | `deepseek-v4-pro` |
| DeepSeek V4 Flash | `deepseek-v4-flash` |

> The legacy IDs `deepseek-chat` and `deepseek-reasoner` are deprecated as of July 2026 — they now both map to V4 Flash.

## Model Selection Priority

Claude Code resolves the model in this order (highest to lowest):

1. **Per-project settings** — `<project>/.claude/settings.json`
2. **Global settings** — `~/.claude/settings.json`
3. **Env vars** — `ANTHROPIC_MODEL`, `ANTHROPIC_SMALL_FAST_MODEL`

## This Project

This project's `.claude/settings.json` is set to **`deepseek-v4-flash`** (faster, cheaper for lightweight dev work).

The global default in `~/.claude/settings.json` is **`deepseek-v4-pro`** (full power for heavy lifting).

## System-wide Configuration (on this machine)

The following is set in `~/.zshrc` to route all Claude Code traffic through DeepSeek:

```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-...       # DeepSeek API key
export ANTHROPIC_SMALL_FAST_MODEL=deepseek-v4-flash
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

`ANTHROPIC_MODEL` is intentionally **not** set in `.zshrc` — that would override per-project settings and prevent switching between Pro and Flash per project.

Also available as shell aliases:

```bash
model-pro()   { echo '{"model":"deepseek-v4-pro"}'   > .claude/settings.json; }
model-flash() { echo '{"model":"deepseek-v4-flash"}' > .claude/settings.json; }
```

Run from a project root to switch that project's model, then restart Claude Code.

## Switching Models

To switch this project between Flash and Pro:

1. **Via shell alias** (from this project directory):
   ```bash
   model-pro     # → deepseek-v4-pro
   model-flash   # → deepseek-v4-flash
   ```

2. **Manually** — edit `.claude/settings.json`:
   ```json
   {"model": "deepseek-v4-pro"}
   ```

3. After changing, **restart Claude Code** for it to take effect.

## Quick Reference

| File | Purpose |
|---|---|
| `~/.claude/settings.json` | Global default model (Pro) |
| `.claude/settings.json` | Per-project override (Flash) |
| `~/.zshrc` | API base URL, auth token, small/fast model |
