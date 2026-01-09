import { Injectable, inject, signal, computed } from '@angular/core';
import { FormSchema } from '../../dq-dynamic-form/models/field.model';
import { DevToolsService, ValidationResult } from '../../dq-dynamic-form/dev-tools.service';

/**
 * Service for handling schema import/export and validation
 */
@Injectable({
  providedIn: 'root'
})
export class SchemaIOService {
  private readonly devTools = inject(DevToolsService);

  // JSON editor content
  readonly jsonContent = signal<string>('');

  // Validation results
  readonly validationResult = signal<ValidationResult | null>(null);

  /**
   * Generate formatted JSON from schema
   */
  formatSchema(schema: FormSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Validate a schema
   */
  validateSchema(schema: FormSchema, jsonContent?: string): ValidationResult {
    try {
      const schemaToValidate = jsonContent
        ? JSON.parse(jsonContent)
        : schema;

      const result = this.devTools.validateSchema(schemaToValidate);
      this.validationResult.set(result);
      return result;
    } catch (e) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [`JSON Parse Error: ${(e as Error).message}`],
        warnings: [],
        summary: {
          totalFields: 0,
          requiredFields: 0,
          optionalFields: 0,
          fieldTypes: {},
          hasAutosave: false,
          hasSubmission: false,
          hasI18n: false,
          errorCount: 1,
          warningCount: 0
        }
      };
      this.validationResult.set(errorResult);
      return errorResult;
    }
  }

  /**
   * Export schema as JSON file
   */
  exportSchema(schema: FormSchema, filename: string = 'form-schema.json'): void {
    const jsonString = this.devTools.exportSchema(schema);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import schema from JSON file
   */
  async importSchemaFromFile(file: File): Promise<{ schema?: FormSchema; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importResult = this.devTools.importSchema(content);
        resolve(importResult);
      };
      reader.onerror = () => {
        resolve({ error: 'Failed to read file' });
      };
      reader.readAsText(file);
    });
  }

  /**
   * Import schema from JSON string
   */
  importSchemaFromString(jsonString: string): { schema?: FormSchema; error?: string } {
    return this.devTools.importSchema(jsonString);
  }

  /**
   * Generate TypeScript interface from schema
   */
  generateTypeScriptInterface(schema: FormSchema, interfaceName: string = 'FormData'): string {
    return this.devTools.generateTypeScriptInterface(schema, interfaceName);
  }

  /**
   * Generate TypeScript interface and copy to clipboard
   */
  async copyTypeScriptToClipboard(schema: FormSchema, interfaceName: string = 'FormData'): Promise<void> {
    const tsCode = this.generateTypeScriptInterface(schema, interfaceName);
    await navigator.clipboard.writeText(tsCode);
  }

  /**
   * Update JSON content
   */
  setJsonContent(content: string): void {
    this.jsonContent.set(content);
  }

  /**
   * Parse JSON content to schema
   */
  parseJsonToSchema(jsonString: string): { schema?: FormSchema; error?: string } {
    try {
      const schema = JSON.parse(jsonString) as FormSchema;
      return { schema };
    } catch (e) {
      return { error: `Invalid JSON: ${(e as Error).message}` };
    }
  }
}
