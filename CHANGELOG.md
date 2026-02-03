# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-03

### Added
- Initial release
- IME detection for Vietnamese, Chinese, Japanese, Korean
- Composition buffering with configurable timeout
- Debug mode for troubleshooting
- CLI wrapper: `timp claude`, `timp gemini`
- Support for Thai, Arabic, Hindi, and other languages

### Technical
- Uses node-pty for pseudo-terminal handling
- 50ms default composition timeout
- Unicode detection for multi-byte characters
