import { Injectable } from '@angular/core';
import { FieldMask, FieldMaskConfig } from './models/field.model';

/**
 * Mask Service
 * Handles input masking and formatting for various field types
 */
@Injectable({
  providedIn: 'root'
})
export class MaskService {
  /**
   * Predefined mask patterns
   */
  private readonly MASKS: Record<string, { pattern: string; placeholder?: string; prefix?: string }> = {
    'phone': { pattern: '(000) 000-0000' },
    'phone-intl': { pattern: '(000) 000-0000', prefix: '+1 ' },
    'credit-card': { pattern: '0000 0000 0000 0000' },
    'ssn': { pattern: '000-00-0000' },
    'zip': { pattern: '00000' },
    'zip-plus4': { pattern: '00000-0000' },
    'date-us': { pattern: '00/00/0000' },
    'time': { pattern: '00:00' }
  };

  /**
   * Apply mask to input value
   */
  applyMask(value: string, mask: FieldMask): string {
    if (!value) return '';

    // Handle currency separately
    if (mask === 'currency') {
      return this.formatCurrency(value);
    }

    // Get mask pattern
    const maskConfig = this.getMaskConfig(mask);
    if (!maskConfig) return value;

    // Remove all non-numeric/non-alphabetic characters
    const cleaned = this.cleanValue(value, maskConfig.pattern);

    // Apply the mask pattern
    const masked = this.applyPattern(cleaned, maskConfig.pattern);

    // Add prefix/suffix if configured
    let result = masked;
    if (maskConfig.prefix) {
      result = maskConfig.prefix + result;
    }
    if (maskConfig.suffix) {
      result = result + maskConfig.suffix;
    }

    return result;
  }

  /**
   * Get raw (unmasked) value
   */
  getRawValue(value: string, mask: FieldMask): string {
    if (!value) return '';

    if (mask === 'currency') {
      // Remove currency symbols and commas
      return value.replace(/[$,]/g, '');
    }

    const maskConfig = this.getMaskConfig(mask);
    if (!maskConfig) return value;

    // Remove prefix/suffix
    let cleaned = value;
    if (maskConfig.prefix) {
      cleaned = cleaned.replace(maskConfig.prefix, '');
    }
    if (maskConfig.suffix) {
      cleaned = cleaned.replace(maskConfig.suffix, '');
    }

    // Remove all non-alphanumeric characters
    return cleaned.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get mask configuration
   */
  private getMaskConfig(mask: FieldMask): { pattern: string; placeholder?: string; prefix?: string; suffix?: string } | null {
    if (typeof mask === 'string') {
      return this.MASKS[mask] || null;
    }

    // Custom mask configuration
    if (typeof mask === 'object' && mask.type === 'custom') {
      return {
        pattern: mask.pattern,
        placeholder: mask.placeholder,
        prefix: mask.prefix,
        suffix: mask.suffix
      };
    }

    return null;
  }

  /**
   * Clean value based on pattern
   */
  private cleanValue(value: string, pattern: string): string {
    // Determine what characters are allowed based on pattern
    const hasDigits = pattern.includes('0');
    const hasLetters = pattern.includes('A');
    const hasAlphanumeric = pattern.includes('*');

    if (hasAlphanumeric) {
      return value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (hasDigits && hasLetters) {
      return value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (hasDigits) {
      return value.replace(/\D/g, '');
    } else if (hasLetters) {
      return value.replace(/[^a-zA-Z]/g, '');
    }

    return value;
  }

  /**
   * Apply pattern to cleaned value
   * Pattern legend:
   * 0 = digit (0-9)
   * A = letter (a-zA-Z)
   * * = alphanumeric (0-9, a-zA-Z)
   * \ = escape character
   * Any other character = literal
   */
  private applyPattern(cleaned: string, pattern: string): string {
    let result = '';
    let cleanedIndex = 0;

    for (let i = 0; i < pattern.length && cleanedIndex < cleaned.length; i++) {
      const patternChar = pattern[i];

      if (patternChar === '0') {
        // Digit placeholder
        if (/\d/.test(cleaned[cleanedIndex])) {
          result += cleaned[cleanedIndex];
          cleanedIndex++;
        } else {
          break; // Invalid character, stop masking
        }
      } else if (patternChar === 'A') {
        // Letter placeholder
        if (/[a-zA-Z]/.test(cleaned[cleanedIndex])) {
          result += cleaned[cleanedIndex];
          cleanedIndex++;
        } else {
          break; // Invalid character, stop masking
        }
      } else if (patternChar === '*') {
        // Alphanumeric placeholder
        if (/[a-zA-Z0-9]/.test(cleaned[cleanedIndex])) {
          result += cleaned[cleanedIndex];
          cleanedIndex++;
        } else {
          break; // Invalid character, stop masking
        }
      } else if (patternChar === '\\' && i + 1 < pattern.length) {
        // Escape next character (literal)
        result += pattern[i + 1];
        i++; // Skip next character
      } else {
        // Literal character
        result += patternChar;
      }
    }

    return result;
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: string): string {
    // Remove all non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    let integerPart = parts[0] || '';
    const decimalPart = parts[1] ? '.' + parts[1].slice(0, 2) : '';

    // Add thousands separators
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Add currency symbol
    return '$' + integerPart + decimalPart;
  }

  /**
   * Get mask pattern for display
   */
  getMaskPattern(mask: FieldMask): string {
    if (mask === 'currency') {
      return '$0,000.00';
    }

    const config = this.getMaskConfig(mask);
    if (!config) return '';

    let pattern = config.pattern;
    if (config.prefix) {
      pattern = config.prefix + pattern;
    }
    if (config.suffix) {
      pattern = pattern + config.suffix;
    }

    return pattern;
  }
}
