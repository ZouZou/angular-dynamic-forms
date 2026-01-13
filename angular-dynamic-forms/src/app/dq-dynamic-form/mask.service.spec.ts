import { TestBed } from '@angular/core/testing';
import { MaskService } from './mask.service';

describe('MaskService', () => {
  let service: MaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Predefined Masks', () => {
    it('should format phone number', () => {
      const result = service.applyMask('5551234567', 'phone');
      expect(result).toBe('(555) 123-4567');
    });

    it('should format international phone number', () => {
      const result = service.applyMask('15551234567', 'phone-intl');
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('should format SSN', () => {
      const result = service.applyMask('123456789', 'ssn');
      expect(result).toBe('123-45-6789');
    });

    it('should format credit card', () => {
      const result = service.applyMask('1234567890123456', 'credit-card');
      expect(result).toBe('1234 5678 9012 3456');
    });

    it('should format ZIP code', () => {
      const result = service.applyMask('12345', 'zip');
      expect(result).toBe('12345');
    });

    it('should format ZIP+4', () => {
      const result = service.applyMask('123456789', 'zip-plus4');
      expect(result).toBe('12345-6789');
    });

    it('should format US date', () => {
      const result = service.applyMask('12312025', 'date-us');
      expect(result).toBe('12/31/2025');
    });

    it('should format time', () => {
      const result = service.applyMask('1430', 'time');
      expect(result).toBe('14:30');
    });
  });

  describe('Custom Masks', () => {
    it('should apply custom digit mask', () => {
      const result = service.applyMask('123', { type: 'custom', pattern: '000-000' });
      expect(result).toBe('123-');
    });

    it('should apply custom letter mask', () => {
      const result = service.applyMask('ABC', { type: 'custom', pattern: 'AAA-AAA' });
      expect(result).toBe('ABC-');
    });

    it('should apply custom alphanumeric mask', () => {
      const result = service.applyMask('AB12', { type: 'custom', pattern: '**-**' });
      expect(result).toBe('AB-12');
    });

    it('should handle escaped characters', () => {
      const result = service.applyMask('123', { type: 'custom', pattern: '\\000-000' });
      expect(result).toBe('0');
    });
  });

  describe('Mask Validation', () => {
    it('should validate complete phone number', () => {
      const isValid = service.isValidMaskedValue('(555) 123-4567', 'phone');
      expect(isValid).toBe(true);
    });

    it('should reject incomplete phone number', () => {
      const isValid = service.isValidMaskedValue('(555) 123', 'phone');
      expect(isValid).toBe(false);
    });

    it('should validate complete SSN', () => {
      const isValid = service.isValidMaskedValue('123-45-6789', 'ssn');
      expect(isValid).toBe(true);
    });

    it('should reject incomplete SSN', () => {
      const isValid = service.isValidMaskedValue('123-45', 'ssn');
      expect(isValid).toBe(false);
    });

    it('should validate complete custom mask', () => {
      const isValid = service.isValidMaskedValue('123-456', { type: 'custom', pattern: '000-000' });
      expect(isValid).toBe(true);
    });
  });

  describe('Mask Patterns', () => {
    it('should get pattern for predefined mask', () => {
      const pattern = service.getMaskPattern('phone');
      expect(pattern).toBe('(000) 000-0000');
    });

    it('should get pattern for custom mask', () => {
      const customMask = {
        type: 'custom' as const,
        pattern: 'AAA-0000'
      };
      const pattern = service.getMaskPattern(customMask);
      expect(pattern).toBe('AAA-0000');
    });

    it('should return empty string for unknown mask', () => {
      const pattern = service.getMaskPattern('unknown' as any);
      expect(pattern).toBe('');
    });
  });

  describe('Max Length Calculation', () => {
    it('should calculate max length for phone mask', () => {
      const maxLength = service.getMaxLength('phone');
      expect(maxLength).toBe(14); // (555) 123-4567
    });

    it('should calculate max length for SSN mask', () => {
      const maxLength = service.getMaxLength('ssn');
      expect(maxLength).toBe(11); // 123-45-6789
    });

    it('should calculate max length for credit card mask', () => {
      const maxLength = service.getMaxLength('credit-card');
      expect(maxLength).toBe(19); // 1234 5678 9012 3456
    });

    it('should calculate max length for custom mask', () => {
      const customMask = {
        type: 'custom' as const,
        pattern: '000-AAA'
      };
      const maxLength = service.getMaxLength(customMask);
      expect(maxLength).toBe(7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = service.applyMask('', 'phone');
      expect(result).toBe('');
    });

    it('should handle null mask', () => {
      const result = service.applyMask('12345', null as any);
      expect(result).toBe('12345');
    });

    it('should handle undefined mask', () => {
      const result = service.applyMask('12345', undefined as any);
      expect(result).toBe('12345');
    });

    it('should handle input longer than mask', () => {
      const result = service.applyMask('123456789012345678', 'phone');
      // Should only apply mask to the length of the pattern
      expect(result.length).toBeLessThanOrEqual(14);
    });

    it('should handle non-numeric input for number mask', () => {
      const result = service.applyMask('abc', 'phone');
      expect(result).toBe('');
    });

    it('should handle non-alphabetic input for letter mask', () => {
      const customMask = {
        type: 'custom' as const,
        pattern: 'AAA'
      };
      const result = service.applyMask('123', customMask);
      expect(result).toBe('');
    });
  });

  describe('Real-time Input Handling', () => {
    it('should format as user types phone number', () => {
      expect(service.applyMask('5', 'phone')).toBe('(5');
      expect(service.applyMask('55', 'phone')).toBe('(55');
      expect(service.applyMask('555', 'phone')).toBe('(555) ');
      expect(service.applyMask('5551', 'phone')).toBe('(555) 1');
      expect(service.applyMask('55512', 'phone')).toBe('(555) 12');
      expect(service.applyMask('555123', 'phone')).toBe('(555) 123');
      expect(service.applyMask('5551234', 'phone')).toBe('(555) 123-4');
    });

    it('should format as user types SSN', () => {
      expect(service.applyMask('1', 'ssn')).toBe('1');
      expect(service.applyMask('12', 'ssn')).toBe('12');
      expect(service.applyMask('123', 'ssn')).toBe('123-');
      expect(service.applyMask('1234', 'ssn')).toBe('123-4');
      expect(service.applyMask('12345', 'ssn')).toBe('123-45-');
      expect(service.applyMask('123456', 'ssn')).toBe('123-45-6');
    });
  });

  // Note: getPlaceholder method removed - placeholder functionality now handled differently
});
