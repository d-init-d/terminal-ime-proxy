/**
 * Composition Buffer
 * Buffers IME input during composition and flushes when complete
 */

export interface CompositionState {
  isComposing: boolean;
  buffer: string;
  lastInputTime: number;
  flushTimer: NodeJS.Timeout | null;
}

export interface CompositionBufferOptions {
  /**
   * Time in ms to wait after last input before flushing buffer
   * Default: 50ms
   */
  compositionTimeout?: number;
  
  /**
   * Callback when buffer is flushed (composition complete)
   */
  onFlush: (text: string) => void;
  
  /**
   * Callback for regular (non-IME) input
   */
  onRegularInput: (text: string) => void;
  
  /**
   * Optional callback for debug logging
   */
  onDebug?: (message: string) => void;
}

export class CompositionBuffer {
  private state: CompositionState = {
    isComposing: false,
    buffer: '',
    lastInputTime: 0,
    flushTimer: null,
  };
  
  private options: Required<Omit<CompositionBufferOptions, 'onDebug'>> & { onDebug?: (msg: string) => void };
  private readonly DEFAULT_TIMEOUT = 50; // ms
  
  constructor(options: CompositionBufferOptions) {
    this.options = {
      compositionTimeout: options.compositionTimeout ?? this.DEFAULT_TIMEOUT,
      onFlush: options.onFlush,
      onRegularInput: options.onRegularInput,
      onDebug: options.onDebug,
    };
  }
  
  /**
   * Process incoming input
   * Buffers IME input, passes through regular input
   */
  public process(input: string, isIME: boolean): void {
    const now = Date.now();
    
    if (isIME) {
      this.handleIMEInput(input, now);
    } else {
      this.handleRegularInput(input);
    }
  }
  
  /**
   * Handle IME input - buffer and set flush timer
   */
  private handleIMEInput(input: string, now: number): void {
    this.debug(`IME input received: "${input}" (${this.toHex(input)})`);
    
    // Start or continue composition
    this.state.isComposing = true;
    this.state.buffer += input;
    this.state.lastInputTime = now;
    
    // Clear previous flush timer
    if (this.state.flushTimer) {
      clearTimeout(this.state.flushTimer);
    }
    
    // Set new flush timer
    this.state.flushTimer = setTimeout(() => {
      this.flush();
    }, this.options.compositionTimeout);
    
    this.debug(`Buffer now: "${this.state.buffer}"`);
  }
  
  /**
   * Handle regular (non-IME) input
   */
  private handleRegularInput(input: string): void {
    this.debug(`Regular input: "${input}" (${this.toHex(input)})`);
    
    // If we were composing, flush the buffer first
    if (this.state.isComposing && this.state.buffer) {
      this.flush();
    }
    
    // Pass through regular input
    this.options.onRegularInput(input);
  }
  
  /**
   * Flush the composition buffer
   */
  public flush(): void {
    if (this.state.flushTimer) {
      clearTimeout(this.state.flushTimer);
      this.state.flushTimer = null;
    }
    
    if (this.state.buffer) {
      this.debug(`Flushing buffer: "${this.state.buffer}"`);
      this.options.onFlush(this.state.buffer);
      this.state.buffer = '';
    }
    
    this.state.isComposing = false;
  }
  
  /**
   * Check if currently composing
   */
  public isComposing(): boolean {
    return this.state.isComposing;
  }
  
  /**
   * Get current buffer content
   */
  public getBuffer(): string {
    return this.state.buffer;
  }
  
  /**
   * Clear buffer without flushing
   */
  public clear(): void {
    if (this.state.flushTimer) {
      clearTimeout(this.state.flushTimer);
      this.state.flushTimer = null;
    }
    this.state.buffer = '';
    this.state.isComposing = false;
    this.debug('Buffer cleared');
  }
  
  /**
   * Handle backspace during composition
   */
  public backspace(): boolean {
    if (this.state.buffer.length > 0) {
      // Remove last character from buffer
      // Note: This is simplified; proper implementation would need to
      // handle multi-byte characters and combining marks correctly
      const chars = [...this.state.buffer];
      chars.pop();
      this.state.buffer = chars.join('');
      this.debug(`Backspace in buffer, now: "${this.state.buffer}"`);
      return true; // Handled
    }
    return false; // Not handled, let caller deal with it
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.state.flushTimer) {
      clearTimeout(this.state.flushTimer);
      this.state.flushTimer = null;
    }
  }
  
  /**
   * Debug logging helper
   */
  private debug(message: string): void {
    if (this.options.onDebug) {
      this.options.onDebug(`[CompositionBuffer] ${message}`);
    }
  }
  
  /**
   * Convert string to hex representation for debugging
   */
  private toHex(str: string): string {
    return Buffer.from(str, 'utf8')
      .toString('hex')
      .match(/.{1,2}/g)
      ?.join(' ') ?? '';
  }
}

/**
 * Factory function for creating a composition buffer
 */
export function createCompositionBuffer(options: CompositionBufferOptions): CompositionBuffer {
  return new CompositionBuffer(options);
}
