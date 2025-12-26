import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { I18nConfig } from './models/field.model';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default locale', () => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': {
            greeting: 'Hello'
          }
        }
      };

      service.initialize(config);
      expect(service.getCurrentLocale()).toBe('en-US');
    });

    it('should not initialize when disabled', () => {
      const config: I18nConfig = {
        enabled: false,
        defaultLocale: 'en-US',
        translations: {}
      };

      service.initialize(config);
      // Should still return default locale
      expect(service.getCurrentLocale()).toBeTruthy();
    });
  });

  describe('Locale Management', () => {
    beforeEach(() => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': { greeting: 'Hello' },
          'es-ES': { greeting: 'Hola' },
          'fr-FR': { greeting: 'Bonjour' }
        }
      };
      service.initialize(config);
    });

    it('should get current locale', () => {
      expect(service.getCurrentLocale()).toBe('en-US');
    });

    it('should set locale', () => {
      service.setLocale('es-ES');
      expect(service.getCurrentLocale()).toBe('es-ES');
    });

    it('should warn when setting non-existent locale', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.setLocale('de-DE');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('de-DE'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Translation', () => {
    beforeEach(() => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': {
            greeting: 'Hello',
            welcome: 'Welcome, {{name}}',
            errors: {
              required: 'This field is required',
              invalid: 'Invalid value'
            }
          },
          'es-ES': {
            greeting: 'Hola',
            welcome: 'Bienvenido, {{name}}'
          }
        }
      };
      service.initialize(config);
    });

    it('should translate simple key', () => {
      expect(service.translate('greeting')).toBe('Hello');
    });

    it('should use short alias t()', () => {
      expect(service.t('greeting')).toBe('Hello');
    });

    it('should translate nested key with dot notation', () => {
      expect(service.translate('errors.required')).toBe('This field is required');
      expect(service.translate('errors.invalid')).toBe('Invalid value');
    });

    it('should return key when translation not found', () => {
      expect(service.translate('nonexistent')).toBe('nonexistent');
    });

    it('should replace parameters in translation', () => {
      const result = service.translate('welcome', { name: 'John' });
      expect(result).toBe('Welcome, John');
    });

    it('should translate based on current locale', () => {
      expect(service.translate('greeting')).toBe('Hello');

      service.setLocale('es-ES');
      expect(service.translate('greeting')).toBe('Hola');
    });

    it('should replace multiple parameters', () => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': {
            message: 'Hello {{name}}, you have {{count}} messages'
          }
        }
      };
      service.initialize(config);

      const result = service.translate('message', { name: 'Alice', count: 5 });
      expect(result).toBe('Hello Alice, you have 5 messages');
    });
  });

  describe('RTL Support', () => {
    it('should detect RTL languages', () => {
      const rtlConfig: I18nConfig = {
        enabled: true,
        defaultLocale: 'ar-SA',
        translations: { 'ar-SA': {} }
      };
      service.initialize(rtlConfig);

      expect(service.isRTL()).toBe(true);
      expect(service.getDirection()).toBe('rtl');
    });

    it('should detect LTR languages', () => {
      const ltrConfig: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: { 'en-US': {} }
      };
      service.initialize(ltrConfig);

      expect(service.isRTL()).toBe(false);
      expect(service.getDirection()).toBe('ltr');
    });

    it('should handle Hebrew (RTL)', () => {
      const hebrewConfig: I18nConfig = {
        enabled: true,
        defaultLocale: 'he-IL',
        translations: { 'he-IL': {} }
      };
      service.initialize(hebrewConfig);

      expect(service.isRTL()).toBe(true);
    });

    it('should handle Farsi (RTL)', () => {
      const farsiConfig: I18nConfig = {
        enabled: true,
        defaultLocale: 'fa-IR',
        translations: { 'fa-IR': {} }
      };
      service.initialize(farsiConfig);

      expect(service.isRTL()).toBe(true);
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {}
      };
      service.initialize(config);
    });

    it('should format date according to locale', () => {
      const date = new Date('2025-01-15');
      const formatted = service.formatDate(date);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2025');
    });

    it('should format date string', () => {
      const formatted = service.formatDate('2025-01-15');

      expect(formatted).toBeTruthy();
    });

    it('should handle date formatting errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = service.formatDate('invalid-date');
      expect(result).toBeTruthy();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Number Formatting', () => {
    beforeEach(() => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {}
      };
      service.initialize(config);
    });

    it('should format number according to locale', () => {
      const formatted = service.formatNumber(1234.56);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format number with options', () => {
      const formatted = service.formatNumber(1234.5, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      expect(formatted).toBeTruthy();
    });

    it('should handle number formatting errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = service.formatNumber(NaN);
      expect(result).toBe('NaN');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Currency Formatting', () => {
    beforeEach(() => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {}
      };
      service.initialize(config);
    });

    it('should format currency with default USD', () => {
      const formatted = service.formatCurrency(1234.56);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format currency with custom currency code', () => {
      const formatted = service.formatCurrency(1234.56, 'EUR');

      expect(formatted).toBeTruthy();
    });

    it('should handle currency formatting errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = service.formatCurrency(1234.56, 'INVALID');
      expect(result).toContain('INVALID');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty translations', () => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {}
      };
      service.initialize(config);

      expect(service.translate('anything')).toBe('anything');
    });

    it('should handle deeply nested keys', () => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': {
            level1: {
              level2: {
                level3: {
                  message: 'Deep value'
                }
              }
            }
          }
        }
      };
      service.initialize(config);

      expect(service.translate('level1.level2.level3.message')).toBe('Deep value');
    });

    it('should handle non-string translation values', () => {
      const config: I18nConfig = {
        enabled: true,
        defaultLocale: 'en-US',
        translations: {
          'en-US': {
            number: 123,
            boolean: true,
            object: { key: 'value' }
          }
        }
      };
      service.initialize(config);

      // Non-string values should return null/key
      expect(service.translate('number')).toBe('number');
      expect(service.translate('boolean')).toBe('boolean');
      expect(service.translate('object')).toBe('object');
    });
  });
});
