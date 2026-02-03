# terminal-ime-proxy

> Fix IME input for terminal CLI applications like Claude Code, Gemini CLI, and other React Ink-based tools.

[![npm version](https://badge.fury.io/js/terminal-ime-proxy.svg)](https://www.npmjs.com/package/terminal-ime-proxy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Claude Code, Gemini CLI, and other React Ink-based terminal applications have a bug that causes character loss when typing with IME (Input Method Editor). This affects:

- Vietnamese - Telex, VNI, VIQR input methods
- Chinese - Pinyin, Wubi input methods
- Japanese - Romaji, Hiragana, Katakana
- Korean - 2-set Hangul

**Example:**
```
Typing "xin chào" (Vietnamese for "hello"):
Without fix: "xin cho" or "xin hào" (missing/wrong characters)
With fix: "xin chào" (correct!)
```

## Installation

```bash
# Install globally
npm install -g terminal-ime-proxy

# Or use directly with npx
npx terminal-ime-proxy claude
```

## Usage

```bash
# Run Claude Code with IME fix
terminal-ime-proxy claude

# Use shorter alias
timp claude

# Run Gemini CLI
timp gemini

# Run with debug mode
timp --debug claude
```

## How It Works

1. **Intercepts** keyboard input from your terminal
2. **Detects** when IME is composing characters
3. **Buffers** input during composition
4. **Sends** completed characters to the wrapped application

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--debug` | `-d` | Enable debug output |
| `--timeout <ms>` | `-t` | Composition timeout (default: 50ms) |
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version |

## Supported Applications

- Claude Code (`claude`)
- Gemini CLI (`gemini`)
- Codex CLI (`codex`)
- Any React Ink-based CLI tool

## Why This Exists

React Ink (the framework used by Claude Code and other tools) has a bug in its input handling that doesn't properly support IME composition. The bug is tracked in:

- [anthropics/claude-code#10429](https://github.com/anthropics/claude-code/issues/10429)
- [vadimdemedes/ink#759](https://github.com/vadimdemedes/ink/issues/759)

Until the upstream fix is merged, this tool provides a workaround.

## License

MIT © d-init-d

---

**Made with love for the international developer community**
