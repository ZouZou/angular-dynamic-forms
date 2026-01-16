import { Injectable, signal } from '@angular/core';
import { I18nConfig } from './models/field.model';

/**
 * I18n Service
 * Handles internationalization and localization for dynamic forms
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  // Current locale signal
  private readonly currentLocale = signal<string>('en-US');

  // Translations storage
  private translations: Record<string, any> = {};

  // RTL locales
  private readonly RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

  /**
   * Initialize i18n with configuration
   */
  initialize(config: I18nConfig): void {
    if (!config.enabled) return;

    this.currentLocale.set(config.defaultLocale);
    this.translations = config.translations || {};
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string {
    return this.currentLocale();
  }

  /**
   * Set current locale
   */
  setLocale(locale: string): void {
    if (this.translations[locale]) {
      this.currentLocale.set(locale);
    } else {
      console.warn(`Locale ${locale} not found in translations`);
    }
  }

  /**
   * Translate a key
   * Supports dot notation for nested keys: "errors.required"
   */
  translate(key: string, params?: Record<string, any>): string {
    const locale = this.currentLocale();
    const translation = this.getNestedTranslation(locale, key);

    if (!translation) {
      // Fallback to key if translation not found
      return key;
    }

    // Replace parameters if provided
    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Short alias for translate
   */
  t(key: string, params?: Record<string, any>): string {
    return this.translate(key, params);
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(): boolean {
    const locale = this.currentLocale();
    const langCode = locale.split('-')[0].toLowerCase();
    return this.RTL_LOCALES.includes(langCode);
  }

  /**
   * Get text direction for current locale
   */
  getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  /**
   * Get nested translation using dot notation
   */
  private getNestedTranslation(locale: string, key: string): string | null {
    const keys = key.split('.');
    let value: any = this.translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Replace parameters in translation string
   * Supports {{param}} syntax
   */
  private replaceParams(text: string, params: Record<string, any>): string {
    let result = text;

    Object.keys(params).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(params[key]));
    });

    return result;
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date | string, format?: string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = this.currentLocale();

    try {
      // Use Intl.DateTimeFormat for locale-specific formatting
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.currentLocale();

    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch (error) {
      console.error('Error formatting number:', error);
      return String(value);
    }
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    const locale = this.currentLocale();

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${value}`;
    }
  }
}
