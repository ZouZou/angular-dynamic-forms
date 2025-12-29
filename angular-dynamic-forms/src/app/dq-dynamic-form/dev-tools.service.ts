import { Injectable } from '@angular/core';
import { Field, FormSchema, FieldValidations } from './models/field.model';

/**
 * Developer Tools Service
 * Provides utilities for debugging, validation, and development
 */
@Injectable({
  providedIn: 'root'
})
export class DevToolsService {

  /**
   * Validate form schema configuration
   * Returns array of warnings/errors
   */
  validateSchema(schema: FormSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic schema structure
    if (!schema.title) {
      errors.push('Schema is missing required "title" property');
    }

    if (!schema.fields && !schema.sections) {
      errors.push('Schema must have either "fields" or "sections" property');
    }

    // Get all fields
    const allFields = this.getAllFields(schema);

    // Validate each field
    allFields.forEach((field, index) => {
      this.validateField(field, index, allFields, errors, warnings);
    });

    // Check for duplicate field names
    this.checkDuplicateNames(allFields, errors);

    // Validate dependencies
    this.validateDependencies(allFields, errors, warnings);

    // Validate computed fields
    this.validateComputedFields(allFields, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: this.generateSummary(schema, allFields, errors, warnings)
    };
  }

  /**
   * Get all fields from schema (flattens sections)
   */
  private getAllFields(schema: FormSchema): Field[] {
    const fields: Field[] = [];

    if (schema.fields) {
      fields.push(...schema.fields);
    }

    if (schema.sections) {
      schema.sections.forEach(section => {
        fields.push(...section.fields);
      });
    }

    return fields;
  }

  /**
   * Validate individual field
   */
  private validateField(
    field: Field,
    index: number,
    allFields: Field[],
    errors: string[],
    warnings: string[]
  ): void {
    const fieldRef = `Field[${index}] "${field.name}"`;

    // Required properties
    if (!field.type) {
      errors.push(`${fieldRef}: Missing required property "type"`);
    }

    if (!field.name) {
      errors.push(`${fieldRef}: Missing required property "name"`);
    }

    if (!field.label) {
      errors.push(`${fieldRef}: Missing required property "label"`);
    }

    // Validate field type
    const validTypes = [
      'text', 'email', 'password', 'number', 'date', 'datetime', 'textarea',
      'select', 'multiselect', 'radio', 'checkbox', 'array', 'range',
      'color', 'file', 'richtext'
    ];

    if (field.type && !validTypes.includes(field.type)) {
      warnings.push(`${fieldRef}: Unknown field type "${field.type}"`);
    }

    // Validate select/radio fields have options
    if ((field.type === 'select' || field.type === 'radio') &&
        !field.options && !field.optionsEndpoint && !field.optionsMap) {
      warnings.push(`${fieldRef}: Select/Radio field should have "options", "optionsEndpoint", or "optionsMap"`);
    }

    // Validate multiselect fields have options
    if (field.type === 'multiselect' &&
        !field.options && !field.optionsEndpoint && !field.optionsMap) {
      warnings.push(`${fieldRef}: Multiselect field should have "options", "optionsEndpoint", or "optionsMap"`);
    }

    // Validate multiselect min/maxSelections
    if (field.type === 'multiselect') {
      if (field.minSelections !== undefined && field.maxSelections !== undefined &&
          field.minSelections > field.maxSelections) {
        errors.push(`${fieldRef}: "minSelections" cannot be greater than "maxSelections"`);
      }
    }

    // Validate array fields have arrayConfig
    if (field.type === 'array' && !field.arrayConfig) {
      errors.push(`${fieldRef}: Array field must have "arrayConfig" property`);
    }

    // Validate min/max for number fields
    if (field.type === 'number') {
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        errors.push(`${fieldRef}: "min" (${field.min}) cannot be greater than "max" (${field.max})`);
      }
    }

    // Validate min/max for range fields
    if (field.type === 'range') {
      if (field.min === undefined || field.max === undefined) {
        warnings.push(`${fieldRef}: Range field should have both "min" and "max" properties`);
      }
      if (field.min !== undefined && field.max !== undefined && field.min >= field.max) {
        errors.push(`${fieldRef}: "min" must be less than "max" for range fields`);
      }
    }

    // Validate file upload fields
    if (field.type === 'file') {
      if (field.maxFileSize !== undefined && field.maxFileSize <= 0) {
        warnings.push(`${fieldRef}: "maxFileSize" should be a positive number`);
      }
    }

    // Validate richtext fields
    if (field.type === 'richtext') {
      if (field.maxCharacters !== undefined && field.maxCharacters <= 0) {
        warnings.push(`${fieldRef}: "maxCharacters" should be a positive number`);
      }
    }

    // Validate validations
    if (field.validations) {
      this.validateFieldValidations(field, fieldRef, warnings);
    }

    // Validate mask
    if (field.mask) {
      const validMasks = ['phone', 'phone-intl', 'ssn', 'credit-card', 'zip', 'zip-plus4', 'date-us', 'time', 'currency'];
      if (typeof field.mask === 'string' && !validMasks.includes(field.mask)) {
        warnings.push(`${fieldRef}: Unknown mask type "${field.mask}"`);
      }
    }

    // Validate computed fields
    if (field.computed && field.type !== 'text') {
      warnings.push(`${fieldRef}: Computed fields work best with type="text"`);
    }

    if (field.computed && !field.readonly) {
      warnings.push(`${fieldRef}: Computed fields should be readonly`);
    }
  }

  /**
   * Validate field validations
   */
  private validateFieldValidations(field: Field, fieldRef: string, warnings: string[]): void {
    const validations = field.validations!;

    // Check minLength/maxLength
    if (validations.minLength !== undefined && validations.maxLength !== undefined) {
      if (validations.minLength > validations.maxLength) {
        warnings.push(`${fieldRef}: "minLength" cannot be greater than "maxLength"`);
      }
    }

    // Check requiredTrue on non-checkbox
    if (validations.requiredTrue && field.type !== 'checkbox') {
      warnings.push(`${fieldRef}: "requiredTrue" validation is only for checkbox fields`);
    }

    // Check pattern validation
    if (validations.pattern) {
      try {
        new RegExp(validations.pattern as string);
      } catch (e) {
        warnings.push(`${fieldRef}: Invalid regex pattern in validations`);
      }
    }
  }

  /**
   * Check for duplicate field names
   */
  private checkDuplicateNames(fields: Field[], errors: string[]): void {
    const nameMap = new Map<string, number>();

    fields.forEach(field => {
      if (field.name) {
        const count = nameMap.get(field.name) || 0;
        nameMap.set(field.name, count + 1);
      }
    });

    nameMap.forEach((count, name) => {
      if (count > 1) {
        errors.push(`Duplicate field name "${name}" found ${count} times`);
      }
    });
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(fields: Field[], errors: string[], warnings: string[]): void {
    const fieldNames = new Set(fields.map(f => f.name));

    fields.forEach(field => {
      if (field.dependsOn) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];

        dependencies.forEach(dep => {
          if (!fieldNames.has(dep)) {
            errors.push(`Field "${field.name}" depends on non-existent field "${dep}"`);
          }
        });

        // Check for circular dependencies
        if (this.hasCircularDependency(field, fields)) {
          errors.push(`Field "${field.name}" has circular dependency`);
        }
      }

      // Validate visibleWhen references
      if (field.visibleWhen && 'field' in field.visibleWhen) {
        const condition = field.visibleWhen as any;
        if (condition.field && !fieldNames.has(condition.field)) {
          errors.push(`Field "${field.name}" visibleWhen references non-existent field "${condition.field}"`);
        }
      }
    });
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(field: Field, allFields: Field[], visited: Set<string> = new Set()): boolean {
    if (!field.dependsOn) return false;
    if (visited.has(field.name)) return true;

    visited.add(field.name);

    const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];

    for (const depName of dependencies) {
      const depField = allFields.find(f => f.name === depName);
      if (depField && this.hasCircularDependency(depField, allFields, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate computed fields
   */
  private validateComputedFields(fields: Field[], errors: string[], warnings: string[]): void {
    const fieldNames = new Set(fields.map(f => f.name));

    fields.forEach(field => {
      if (field.computed) {
        // Check dependencies exist
        field.computed.dependencies.forEach(dep => {
          if (!fieldNames.has(dep)) {
            errors.push(`Computed field "${field.name}" depends on non-existent field "${dep}"`);
          }
        });

        // Warn about circular dependencies in computed fields
        if (field.computed.dependencies.includes(field.name)) {
          errors.push(`Computed field "${field.name}" cannot depend on itself`);
        }
      }
    });
  }

  /**
   * Generate validation summary
   */
  private generateSummary(
    schema: FormSchema,
    fields: Field[],
    errors: string[],
    warnings: string[]
  ): SchemaSummary {
    const fieldTypes = new Map<string, number>();
    let requiredCount = 0;
    let optionalCount = 0;

    fields.forEach(field => {
      // Count field types
      const count = fieldTypes.get(field.type) || 0;
      fieldTypes.set(field.type, count + 1);

      // Count required vs optional
      if (field.validations?.required) {
        requiredCount++;
      } else {
        optionalCount++;
      }
    });

    return {
      totalFields: fields.length,
      requiredFields: requiredCount,
      optionalFields: optionalCount,
      fieldTypes: Object.fromEntries(fieldTypes),
      hasAutosave: !!schema.autosave?.enabled,
      hasSubmission: !!schema.submission?.endpoint,
      hasI18n: !!schema.i18n?.enabled,
      errorCount: errors.length,
      warningCount: warnings.length
    };
  }

  /**
   * Generate TypeScript interface from form schema
   */
  generateTypeScriptInterface(schema: FormSchema, interfaceName: string = 'FormData'): string {
    const fields = this.getAllFields(schema);
    const properties: string[] = [];

    fields.forEach(field => {
      const isRequired = field.validations?.required ?? false;
      const tsType = this.getTypeScriptType(field);
      const optional = isRequired ? '' : '?';

      properties.push(`  ${field.name}${optional}: ${tsType};`);
    });

    return `export interface ${interfaceName} {\n${properties.join('\n')}\n}`;
  }

  /**
   * Get TypeScript type for field
   */
  private getTypeScriptType(field: Field): string {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'textarea':
      case 'richtext':
      case 'color':
        return 'string';
      case 'number':
      case 'range':
        return 'number';
      case 'date':
      case 'datetime':
        return 'string'; // ISO date/datetime string
      case 'checkbox':
        return 'boolean';
      case 'select':
      case 'radio':
        if (field.options && Array.isArray(field.options)) {
          const values = field.options.map(opt =>
            typeof opt === 'string' ? `'${opt}'` : `'${opt.value}'`
          );
          return values.join(' | ');
        }
        return 'string';
      case 'multiselect':
        if (field.options && Array.isArray(field.options)) {
          const values = field.options.map(opt =>
            typeof opt === 'string' ? `'${opt}'` : `'${opt.value}'`
          );
          return `(${values.join(' | ')})[]`;
        }
        return 'string[]';
      case 'file':
        return field.multiple ? 'File[]' : 'File';
      case 'array':
        return 'any[]'; // Could be improved with nested types
      default:
        return 'any';
    }
  }

  /**
   * Export schema as JSON string (formatted)
   */
  exportSchema(schema: FormSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Import schema from JSON string
   */
  importSchema(jsonString: string): { schema?: FormSchema; error?: string } {
    try {
      const schema = JSON.parse(jsonString) as FormSchema;
      const validation = this.validateSchema(schema);

      if (!validation.isValid) {
        return {
          error: `Invalid schema: ${validation.errors.join(', ')}`
        };
      }

      return { schema };
    } catch (e) {
      return {
        error: `JSON parse error: ${(e as Error).message}`
      };
    }
  }
}

// Type definitions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: SchemaSummary;
}

export interface SchemaSummary {
  totalFields: number;
  requiredFields: number;
  optionalFields: number;
  fieldTypes: Record<string, number>;
  hasAutosave: boolean;
  hasSubmission: boolean;
  hasI18n: boolean;
  errorCount: number;
  warningCount: number;
}
