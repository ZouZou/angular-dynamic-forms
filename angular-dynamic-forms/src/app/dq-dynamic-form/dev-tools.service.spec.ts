import { TestBed } from '@angular/core/testing';
import { DevToolsService } from './dev-tools.service';
import { FormSchema } from './models/field.model';

describe('DevToolsService', () => {
  let service: DevToolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevToolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Schema Validation', () => {
    it('should validate a valid schema', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.summary.totalFields).toBe(1);
    });

    it('should detect missing title', () => {
      const schema: any = {
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema is missing required "title" property');
    });

    it('should detect missing fields array', () => {
      const schema: any = {
        title: 'Test Form'
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema is missing required "fields" array');
    });

    it('should detect empty fields array', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: []
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema has no fields defined');
    });

    it('should detect missing field name', () => {
      const schema: any = {
        title: 'Test Form',
        fields: [
          { type: 'text', label: 'Field' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required property "name"'))).toBe(true);
    });

    it('should detect missing field label', () => {
      const schema: any = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'field1' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required property "label"'))).toBe(true);
    });

    it('should detect missing field type', () => {
      const schema: any = {
        title: 'Test Form',
        fields: [
          { name: 'field1', label: 'Field 1' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required property "type"'))).toBe(true);
    });

    it('should detect duplicate field names', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username' },
          { type: 'email', name: 'username', label: 'Email' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate field name'))).toBe(true);
    });

    it('should warn about unknown field types', () => {
      const schema: any = {
        title: 'Test Form',
        fields: [
          { type: 'unknown-type', name: 'field1', label: 'Field 1' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.warnings.some(w => w.includes('Unknown field type'))).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'text',
            name: 'field1',
            label: 'Field 1',
            computed: {
              formula: 'field2 * 2',
              dependencies: ['field2']
            }
          },
          {
            type: 'text',
            name: 'field2',
            label: 'Field 2',
            computed: {
              formula: 'field1 * 2',
              dependencies: ['field1']
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('circular dependency'))).toBe(true);
    });

    it('should detect non-existent dependency references', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'select',
            name: 'city',
            label: 'City',
            dependsOn: 'country',
            optionsMap: {}
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('depends on non-existent field'))).toBe(true);
    });

    it('should detect invalid regex patterns', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'text',
            name: 'field1',
            label: 'Field 1',
            validations: {
              pattern: '['  // Invalid regex
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.warnings.some(w => w.includes('Invalid regex pattern'))).toBe(true);
    });

    it('should warn about min/max constraint violations', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'text',
            name: 'field1',
            label: 'Field 1',
            validations: {
              minLength: 10,
              maxLength: 5
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.warnings.some(w => w.includes('minLength') && w.includes('maxLength'))).toBe(true);
    });

    it('should warn about select fields without options', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'select', name: 'country', label: 'Country' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.warnings.some(w => w.includes('should have "options"'))).toBe(true);
    });

    it('should warn about computed fields without readonly', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'number', name: 'price', label: 'Price' },
          {
            type: 'text',
            name: 'total',
            label: 'Total',
            computed: {
              formula: 'price * 2',
              dependencies: ['price']
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.warnings.some(w => w.includes('should be readonly'))).toBe(true);
    });
  });

  describe('Schema Summary', () => {
    it('should generate correct summary statistics', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } },
          { type: 'email', name: 'email', label: 'Email', validations: { required: true } },
          { type: 'number', name: 'age', label: 'Age' },
          { type: 'checkbox', name: 'terms', label: 'Terms' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.summary.totalFields).toBe(4);
      expect(result.summary.requiredFields).toBe(2);
      expect(result.summary.optionalFields).toBe(2);
      expect(result.summary.fieldTypes['text']).toBe(1);
      expect(result.summary.fieldTypes['email']).toBe(1);
      expect(result.summary.fieldTypes['number']).toBe(1);
      expect(result.summary.fieldTypes['checkbox']).toBe(1);
    });

    it('should detect autosave configuration', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        autosave: {
          enabled: true,
          intervalSeconds: 30,
          storage: 'localStorage'
        },
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.summary.hasAutosave).toBe(true);
    });

    it('should detect submission configuration', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        submission: {
          endpoint: '/api/submit',
          method: 'POST'
        },
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.summary.hasSubmission).toBe(true);
    });

    it('should detect i18n configuration', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        i18n: {
          enabled: true,
          defaultLocale: 'en-US',
          availableLocales: ['en-US'],
          translations: {}
        },
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.summary.hasI18n).toBe(true);
    });
  });

  describe('TypeScript Interface Generation', () => {
    it('should generate interface with default name', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } },
          { type: 'email', name: 'email', label: 'Email', validations: { required: true } }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain('export interface FormData');
      expect(tsCode).toContain('username: string');
      expect(tsCode).toContain('email: string');
    });

    it('should generate interface with custom name', () => {
      const schema: FormSchema = {
        title: 'User Registration',
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema, 'UserRegistration');

      expect(tsCode).toContain('export interface UserRegistration');
      expect(tsCode).toContain('username');
    });

    it('should mark optional fields with question mark', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'required', label: 'Required', validations: { required: true } },
          { type: 'text', name: 'optional', label: 'Optional' }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain('required: string');
      expect(tsCode).toContain('optional?: string');
    });

    it('should map field types correctly', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'text', label: 'Text' },
          { type: 'number', name: 'num', label: 'Number' },
          { type: 'checkbox', name: 'check', label: 'Checkbox' },
          { type: 'date', name: 'date', label: 'Date' }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain('text?: string');
      expect(tsCode).toContain('num?: number');
      expect(tsCode).toContain('check?: boolean');
      expect(tsCode).toContain('date?: string');
    });

    it('should generate union types for select fields with static options', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'select',
            name: 'accountType',
            label: 'Account Type',
            options: [
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' }
            ]
          }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain("accountType?: 'personal' | 'business'");
    });

    it('should handle array fields', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'array',
            name: 'phoneNumbers',
            label: 'Phone Numbers',
            arrayConfig: {
              fields: []
            }
          }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain('phoneNumbers?: any[]');
    });

    it('should handle multiselect fields as arrays', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'multiselect',
            name: 'skills',
            label: 'Skills',
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'ts', label: 'TypeScript' }
            ]
          }
        ]
      };

      const tsCode = service.generateTypeScriptInterface(schema);

      expect(tsCode).toContain("skills?: ('js' | 'ts')[]");
    });
  });

  describe('Export/Import Utilities', () => {
    it('should export schema as JSON string', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      const jsonString = service.exportSchema(schema);

      expect(jsonString).toContain('"title": "Test Form"');
      expect(jsonString).toContain('"username"');
      expect(jsonString).toContain('"text"');
    });

    it('should export with proper indentation', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: []
      };

      const jsonString = service.exportSchema(schema);

      // Should have 2-space indentation
      expect(jsonString).toContain('  ');
    });

    it('should import valid JSON schema', () => {
      const jsonString = JSON.stringify({
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      }, null, 2);

      const result = service.importSchema(jsonString);

      expect(result.schema).toBeDefined();
      expect(result.schema?.title).toBe('Test Form');
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      const result = service.importSchema(invalidJson);

      expect(result.schema).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject invalid schema structure', () => {
      const invalidSchema = JSON.stringify({
        // Missing title
        fields: []
      });

      const result = service.importSchema(invalidSchema);

      expect(result.schema).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid schema');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty schema gracefully', () => {
      const schema: any = {};

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle null schema', () => {
      const result = service.validateSchema(null as any);

      expect(result.isValid).toBe(false);
    });

    it('should handle schema with nested array fields', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          {
            type: 'array',
            name: 'items',
            label: 'Items',
            arrayConfig: {
              fields: [
                { type: 'text', name: 'itemName', label: 'Name' },
                { type: 'number', name: 'quantity', label: 'Quantity' }
              ]
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(true);
    });

    it('should handle complex visibility conditions', () => {
      const schema: FormSchema = {
        title: 'Test Form',
        fields: [
          { type: 'number', name: 'age', label: 'Age' },
          { type: 'text', name: 'accountType', label: 'Account Type' },
          {
            type: 'text',
            name: 'studentId',
            label: 'Student ID',
            visibleWhen: {
              operator: 'and',
              conditions: [
                { field: 'age', operator: 'lessThan', value: 25 },
                { field: 'accountType', operator: 'equals', value: 'student' }
              ]
            }
          }
        ]
      };

      const result = service.validateSchema(schema);

      expect(result.isValid).toBe(true);
    });
  });
});
