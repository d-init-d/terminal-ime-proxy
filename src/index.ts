/**
 * Terminal IME Proxy - Main Entry Point
 * 
 * Wraps a terminal CLI application and fixes IME input handling
 * for Vietnamese, Chinese, Japanese, Korean, and other languages.
 */

import { spawn, IPty } from 'node-pty';
import { isIMEInput, detectLanguage } from './ime-detector';
import { CompositionBuffer, createCompositionBuffer } from './composition-buffer';

export interface TerminalIMEProxyOptions {
  /**
   * Command to run
   */
  command: string;
  
  /**
   * Command arguments
   */
  args?: string[];
  
  /**
   * Working directory
   */
  cwd?: string;
  
  /**
   * Environment variables
   */
  env?: NodeJS.ProcessEnv;
  
  /**
   * Composition timeout in ms (default: 50)
   */
  compositionTimeout?: number;
  
  /**
   * Enable debug mode
   */
  debug?: boolean;
  
  /**
   * Terminal columns (default: auto-detect)
   */
  cols?: number;
  
  /**
   * Terminal rows (default: auto-detect)
   */
  rows?: number;
}

export class TerminalIMEProxy {
  private pty: IPty;
  private compositionBuffer: CompositionBuffer;
  private options: TerminalIMEProxyOptions;
  private isDestroyed: boolean = false;
  
  constructor(options: TerminalIMEProxyOptions) {
    this.options = options;
    
    // Create composition buffer
    this.compositionBuffer = createCompositionBuffer({
      compositionTimeout: options.compositionTimeout ?? 50,
      onFlush: (text) => this.sendToApp(text),
      onRegularInput: (text) => this.sendToApp(text),
      onDebug: options.debug ? (msg) => this.debug(msg) : undefined,
    });
    
    // Spawn the target application
    this.pty = this.spawnApp();
    
    // Setup input/output handling
    this.setupInputHandling();
    this.setupOutputHandling();
    this.setupSignalHandling();
    this.setupResizeHandling();
  }
  
  /**
   * Spawn the target application with a pseudo-terminal
   */
  private spawnApp(): IPty {
    const cols = this.options.cols ?? process.stdout.columns ?? 80;
    const rows = this.options.rows ?? process.stdout.rows ?? 24;
    
    this.debug(`Spawning: ${this.options.command} ${(this.options.args ?? []).join(' ')}`);
    this.debug(`Terminal size: ${cols}x${rows}`);
    
    return spawn(this.options.command, this.options.args ?? [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: this.options.cwd ?? process.cwd(),
      env: this.options.env ?? process.env,
    });
  }
  
  /**
   * Setup stdin handling with IME detection
   */
  private setupInputHandling(): void {
    // Enable raw mode if available
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.on('data', (data: Buffer) => {
      if (this.isDestroyed) return;
      
      const input = data.toString('utf8');
      
      this.debug(`Input received: "${input}" (${this.toHex(data)})`);
      
      // Handle special keys
      if (this.handleSpecialKeys(data)) {
        return;
      }
      
      // Check if this is IME input
      const isIME = isIMEInput(input);
      
      if (isIME) {
        const lang = detectLanguage(input);
        this.debug(`Detected IME input (${lang ?? 'unknown'})`);
      }
      
      // Process through composition buffer
      this.compositionBuffer.process(input, isIME);
    });
    
    process.stdin.resume();
  }
  
  /**
   * Handle special keys (Ctrl+C, Backspace, etc.)
   */
  private handleSpecialKeys(data: Buffer): boolean {
    // Ctrl+C (ETX)
    if (data.length === 1 && data[0] === 0x03) {
      this.debug('Ctrl+C detected');
      // Flush any pending composition
      this.compositionBuffer.flush();
      // Forward to app
      this.sendToApp(data.toString());
      return true;
    }
    
    // Ctrl+D (EOT)
    if (data.length === 1 && data[0] === 0x04) {
      this.debug('Ctrl+D detected');
      this.compositionBuffer.flush();
      this.sendToApp(data.toString());
      return true;
    }
    
    // Backspace (DEL or BS)
    if (data.length === 1 && (data[0] === 0x7F || data[0] === 0x08)) {
      this.debug('Backspace detected');
      // Try to handle in composition buffer first
      if (!this.compositionBuffer.backspace()) {
        // Not handled by buffer, send to app
        this.sendToApp(data.toString());
      }
      return true;
    }
    
    // Enter (CR or LF)
    if (data.length === 1 && (data[0] === 0x0D || data[0] === 0x0A)) {
      this.debug('Enter detected');
      // Flush composition before sending enter
      this.compositionBuffer.flush();
      this.sendToApp(data.toString());
      return true;
    }
    
    // Escape sequences (arrow keys, function keys, etc.)
    if (data[0] === 0x1B) {
      this.debug(`Escape sequence: ${this.toHex(data)}`);
      // Flush composition and forward escape sequence
      this.compositionBuffer.flush();
      this.sendToApp(data.toString());
      return true;
    }
    
    return false;
  }
  
  /**
   * Send text to the wrapped application
   */
  private sendToApp(text: string): void {
    if (!this.isDestroyed) {
      this.pty.write(text);
    }
  }
  
  /**
   * Setup output handling (app -> terminal)
   */
  private setupOutputHandling(): void {
    this.pty.onData((data: string) => {
      if (!this.isDestroyed) {
        process.stdout.write(data);
      }
    });
    
    this.pty.onExit(({ exitCode, signal }) => {
      this.debug(`App exited: code=${exitCode}, signal=${signal}`);
      this.destroy();
      process.exit(exitCode);
    });
  }
  
  /**
   * Setup signal handling
   */
  private setupSignalHandling(): void {
    process.on('SIGINT', () => {
      this.debug('SIGINT received');
      // Let the app handle Ctrl+C
    });
    
    process.on('SIGTERM', () => {
      this.debug('SIGTERM received');
      this.destroy();
      process.exit(0);
    });
    
    process.on('exit', () => {
      this.destroy();
    });
  }
  
  /**
   * Setup terminal resize handling
   */
  private setupResizeHandling(): void {
    process.stdout.on('resize', () => {
      if (!this.isDestroyed) {
        const cols = process.stdout.columns ?? 80;
        const rows = process.stdout.rows ?? 24;
        this.debug(`Terminal resized: ${cols}x${rows}`);
        this.pty.resize(cols, rows);
      }
    });
  }
  
  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.debug('Destroying proxy');
    
    // Cleanup composition buffer
    this.compositionBuffer.destroy();
    
    // Restore stdin
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    
    // Kill the PTY
    try {
      this.pty.kill();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  
  /**
   * Debug logging
   */
  private debug(message: string): void {
    if (this.options.debug) {
      console.error(`[terminal-ime-proxy] ${message}`);
    }
  }
  
  /**
   * Convert buffer to hex string
   */
  private toHex(data: Buffer): string {
    return data.toString('hex').match(/.{1,2}/g)?.join(' ') ?? '';
  }
}

/**
 * Main entry point - run from command line
 */
export function main(): void {
  const args = process.argv.slice(2);
  
  // Parse flags
  let debug = false;
  let timeout = 50;
  let commandArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--debug' || arg === '-d') {
      debug = true;
    } else if (arg === '--timeout' || arg === '-t') {
      timeout = parseInt(args[++i], 10) || 50;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log('terminal-ime-proxy v1.0.0');
      process.exit(0);
    } else {
      // Rest is command and its arguments
      commandArgs = args.slice(i);
      break;
    }
  }
  
  if (commandArgs.length === 0) {
    console.error('Error: No command specified');
    console.error('Usage: terminal-ime-proxy [options] <command> [args...]');
    console.error('Run "terminal-ime-proxy --help" for more information');
    process.exit(1);
  }
  
  const command = commandArgs[0];
  const cmdArgs = commandArgs.slice(1);
  
  // Create and run proxy
  new TerminalIMEProxy({
    command,
    args: cmdArgs,
    debug,
    compositionTimeout: timeout,
  });
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
terminal-ime-proxy - Fix IME input for terminal CLI applications

USAGE:
  terminal-ime-proxy [options] <command> [args...]
  timp [options] <command> [args...]

OPTIONS:
  -d, --debug           Enable debug output
  -t, --timeout <ms>    Composition timeout in milliseconds (default: 50)
  -h, --help            Show this help message
  -v, --version         Show version number

EXAMPLES:
  # Run Claude Code with IME fix
  terminal-ime-proxy claude

  # Run with debug mode
  terminal-ime-proxy --debug claude

  # Use shorter alias
  timp claude

  # Run Gemini CLI
  timp gemini

SUPPORTED LANGUAGES:
  - Vietnamese (Telex, VNI, VIQR)
  - Chinese (Pinyin, Wubi)
  - Japanese (Romaji, Hiragana, Katakana)
  - Korean (2-set Hangul)
  - Thai, Arabic, Hindi, and more

DESCRIPTION:
  This tool wraps terminal CLI applications that have issues with
  IME (Input Method Editor) input, such as Claude Code, Gemini CLI,
  and other React Ink-based tools.

  It intercepts keyboard input, properly handles IME composition,
  and forwards the completed text to the wrapped application.

MORE INFO:
  https://github.com/d-init-d/terminal-ime-proxy
`);
}

// Export for use as library
export { isIMEInput, detectLanguage } from './ime-detector';
export { CompositionBuffer, createCompositionBuffer } from './composition-buffer';
