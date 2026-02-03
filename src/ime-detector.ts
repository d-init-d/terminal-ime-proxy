/**
 * IME Detector
 * Detects whether input is from an IME (Input Method Editor)
 * Supports Vietnamese, Chinese, Japanese, Korean, and other multi-byte characters
 */

/**
 * Unicode ranges for different languages
 */
const UNICODE_RANGES = {
  // Vietnamese - Latin Extended Additional + combining diacritics
  vietnamese: {
    // Vietnamese specific characters (with diacritics pre-composed)
    precomposed: /[\u00C0-\u00FF\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01A0-\u01B0\u1EA0-\u1EF9]/,
    // Combining diacritical marks (used during composition)
    combining: /[\u0300-\u036F]/,
  },
  
  // Chinese - CJK Unified Ideographs
  chinese: {
    main: /[\u4E00-\u9FFF]/,           // CJK Unified Ideographs
    extA: /[\u3400-\u4DBF]/,           // CJK Unified Ideographs Extension A
    extB: /[\u{20000}-\u{2A6DF}]/u,    // CJK Unified Ideographs Extension B
    compat: /[\uF900-\uFAFF]/,         // CJK Compatibility Ideographs
    radicals: /[\u2F00-\u2FDF]/,       // Kangxi Radicals
  },
  
  // Japanese
  japanese: {
    hiragana: /[\u3040-\u309F]/,       // Hiragana
    katakana: /[\u30A0-\u30FF]/,       // Katakana
    katakanaExt: /[\u31F0-\u31FF]/,    // Katakana Phonetic Extensions
    halfwidth: /[\uFF65-\uFF9F]/,      // Halfwidth Katakana
  },
  
  // Korean
  korean: {
    hangul: /[\uAC00-\uD7AF]/,         // Hangul Syllables
    jamo: /[\u1100-\u11FF]/,           // Hangul Jamo
    jamoExt: /[\uA960-\uA97F]/,        // Hangul Jamo Extended-A
    compat: /[\u3130-\u318F]/,         // Hangul Compatibility Jamo
  },
  
  // Thai
  thai: /[\u0E00-\u0E7F]/,
  
  // Arabic
  arabic: /[\u0600-\u06FF]/,
  
  // Devanagari (Hindi, etc.)
  devanagari: /[\u0900-\u097F]/,
};

/**
 * Check if a string contains Vietnamese characters
 */
export function isVietnamese(str: string): boolean {
  return (
    UNICODE_RANGES.vietnamese.precomposed.test(str) ||
    UNICODE_RANGES.vietnamese.combining.test(str)
  );
}

/**
 * Check if a string contains Chinese characters
 */
export function isChinese(str: string): boolean {
  return (
    UNICODE_RANGES.chinese.main.test(str) ||
    UNICODE_RANGES.chinese.extA.test(str) ||
    UNICODE_RANGES.chinese.compat.test(str) ||
    UNICODE_RANGES.chinese.radicals.test(str)
  );
}

/**
 * Check if a string contains Japanese characters
 */
export function isJapanese(str: string): boolean {
  return (
    UNICODE_RANGES.japanese.hiragana.test(str) ||
    UNICODE_RANGES.japanese.katakana.test(str) ||
    UNICODE_RANGES.japanese.katakanaExt.test(str) ||
    UNICODE_RANGES.japanese.halfwidth.test(str)
  );
}

/**
 * Check if a string contains Korean characters
 */
export function isKorean(str: string): boolean {
  return (
    UNICODE_RANGES.korean.hangul.test(str) ||
    UNICODE_RANGES.korean.jamo.test(str) ||
    UNICODE_RANGES.korean.jamoExt.test(str) ||
    UNICODE_RANGES.korean.compat.test(str)
  );
}

/**
 * Check if a string contains any CJK (Chinese, Japanese, Korean) characters
 */
export function isCJK(str: string): boolean {
  return isChinese(str) || isJapanese(str) || isKorean(str);
}

/**
 * Check if a string contains multi-byte UTF-8 characters
 */
export function isMultiByte(str: string): boolean {
  return Buffer.byteLength(str, 'utf8') > str.length;
}

/**
 * Check if a string contains combining diacritical marks
 */
export function hasCombiningMarks(str: string): boolean {
  return UNICODE_RANGES.vietnamese.combining.test(str);
}

/**
 * Main IME detection function
 * Returns true if the input appears to be from an IME
 */
export function isIMEInput(input: string): boolean {
  // Empty or single ASCII character - not IME
  if (!input || (input.length === 1 && input.charCodeAt(0) < 128)) {
    return false;
  }
  
  // Check for multi-byte characters
  if (isMultiByte(input)) {
    return true;
  }
  
  // Check for combining marks (Vietnamese, etc.)
  if (hasCombiningMarks(input)) {
    return true;
  }
  
  // Check for specific language ranges
  if (isVietnamese(input) || isCJK(input)) {
    return true;
  }
  
  // Check for Thai, Arabic, Devanagari
  if (
    UNICODE_RANGES.thai.test(input) ||
    UNICODE_RANGES.arabic.test(input) ||
    UNICODE_RANGES.devanagari.test(input)
  ) {
    return true;
  }
  
  return false;
}

/**
 * Detect the language/script of the input
 */
export function detectLanguage(input: string): string | null {
  if (isVietnamese(input)) return 'vietnamese';
  if (isChinese(input)) return 'chinese';
  if (isJapanese(input)) return 'japanese';
  if (isKorean(input)) return 'korean';
  if (UNICODE_RANGES.thai.test(input)) return 'thai';
  if (UNICODE_RANGES.arabic.test(input)) return 'arabic';
  if (UNICODE_RANGES.devanagari.test(input)) return 'devanagari';
  return null;
}

/**
 * Check if input looks like intermediate IME composition
 * (e.g., pinyin 'zho' before becoming '中')
 */
export function isIntermediateComposition(input: string): boolean {
  // Common patterns for intermediate compositions
  // This is heuristic and may need adjustment
  
  // Pinyin patterns (Chinese)
  const pinyinPattern = /^[a-z]{1,6}$/i;
  
  // If it's pure ASCII but in a context where IME might be active,
  // it could be intermediate composition
  if (pinyinPattern.test(input) && input.length > 1) {
    // Could be pinyin, but we need context to know for sure
    // For safety, we return false here and rely on timing-based detection
    return false;
  }
  
  return false;
}
