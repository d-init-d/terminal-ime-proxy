# Vietnamese IME Fix for Claude Code

## Project Overview

Fix the IME (Input Method Editor) bug that affects Vietnamese, Chinese, Japanese, and Korean input in Claude Code CLI and other React Ink-based terminal applications.

**Author**: d-init-d  
**Status**: Phase 1-3 Complete  
**Created**: February 2026  
**Last Updated**: February 3, 2026

---

## Progress Summary

| Phase | Status | Link |
|-------|--------|------|
| Phase 1: terminal-ime-proxy | Complete | [GitHub](https://github.com/d-init-d/terminal-ime-proxy) |
| Phase 2: React Ink PR | Submitted | [PR #865](https://github.com/vadimdemedes/ink/pull/865) |
| Phase 3: Claude Code | Issue Created | [Issue #22853](https://github.com/anthropics/claude-code/issues/22853) |
| Phase 4: Marketing | Pending | - |

---

## Quick Start

```bash
# Install
npm install -g terminal-ime-proxy

# Use with Claude Code
timp claude

# Use with debug mode
timp --debug claude
```

---

## Related Links

- **Package**: https://github.com/d-init-d/terminal-ime-proxy
- **Ink PR**: https://github.com/vadimdemedes/ink/pull/865
- **Claude Issue**: https://github.com/anthropics/claude-code/issues/22853
