import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';
import { DevToolsService, ValidationResult } from '../dq-dynamic-form/dev-tools.service';
import { FormSchema, Field } from '../dq-dynamic-form/models/field.model';

interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  defaultConfig: Partial<Field>;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DqDynamicForm],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss'
})
export class FormBuilder {
  private readonly devTools = inject(DevToolsService);

  // Current form schema being built
  protected readonly schema = signal<FormSchema>({
    title: 'New Form',
    description: 'Build your form by adding fields from the palette',
    fields: []
  });

  // JSON editor content
  protected readonly jsonContent = signal<string>('');

  // Validation results
  protected readonly validationResult = signal<ValidationResult | null>(null);

  // Selected field for editing
  protected readonly selectedFieldIndex = signal<number | null>(null);

  // Field palette templates
  protected readonly fieldTemplates: FieldTemplate[] = [
    {
      type: 'text',
      label: 'Text Input',
      icon: '📝',
      defaultConfig: {
        type: 'text',
        name: 'textField',
        label: 'Text Field',
        placeholder: 'Enter text...'
      }
    },
    {
      type: 'email',
      label: 'Email',
      icon: '📧',
      defaultConfig: {
        type: 'email',
        name: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        validations: { required: true, pattern: 'email' }
      }
    },
    {
      type: 'password',
      label: 'Password',
      icon: '🔒',
      defaultConfig: {
        type: 'password',
        name: 'password',
        label: 'Password',
        validations: { required: true, minLength: 8 }
      }
    },
    {
      type: 'number',
      label: 'Number',
      icon: '🔢',
      defaultConfig: {
        type: 'number',
        name: 'numberField',
        label: 'Number',
        placeholder: '0'
      }
    },
    {
      type: 'textarea',
      label: 'Textarea',
      icon: '📄',
      defaultConfig: {
        type: 'textarea',
        name: 'textareaField',
        label: 'Text Area',
        placeholder: 'Enter multiple lines...',
        rows: 4
      }
    },
    {
      type: 'select',
      label: 'Select',
      icon: '📋',
      defaultConfig: {
        type: 'select',
        name: 'selectField',
        label: 'Select Option',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ]
      }
    },
    {
      type: 'radio',
      label: 'Radio',
      icon: '🔘',
      defaultConfig: {
        type: 'radio',
        name: 'radioField',
        label: 'Choose One',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ]
      }
    },
    {
      type: 'checkbox',
      label: 'Checkbox',
      icon: '☑️',
      defaultConfig: {
        type: 'checkbox',
        name: 'checkboxField',
        label: 'I agree to terms'
      }
    },
    {
      type: 'date',
      label: 'Date',
      icon: '📅',
      defaultConfig: {
        type: 'date',
        name: 'dateField',
        label: 'Select Date'
      }
    }
  ];

  // Computed: selected field
  protected readonly selectedField = computed(() => {
    const index = this.selectedFieldIndex();
    if (index === null) return null;
    const fields = this.schema().fields || [];
    return fields[index];
  });

  // Computed: formatted JSON with syntax highlighting
  protected readonly formattedJson = computed(() => {
    const schema = this.schema();
    return JSON.stringify(schema, null, 2);
  });

  constructor() {
    // Initialize JSON content
    this.updateJsonFromSchema();
    // Initial validation
    this.validateSchema();
  }

  // Add field from palette
  protected addField(template: FieldTemplate): void {
    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    const fieldCount = currentFields.length;

    // Create unique field name
    const newField: Field = {
      ...template.defaultConfig as Field,
      name: `${template.type}Field${fieldCount + 1}`
    };

    // Add field to schema
    const updatedSchema = {
      ...currentSchema,
      fields: [...currentFields, newField]
    };

    this.schema.set(updatedSchema);
    this.updateJsonFromSchema();
    this.validateSchema();

    // Select the newly added field
    this.selectedFieldIndex.set(currentFields.length);
  }

  // Remove field
  protected removeField(index: number): void {
    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    const updatedFields = currentFields.filter((_, i) => i !== index);

    this.schema.set({
      ...currentSchema,
      fields: updatedFields
    });

    this.updateJsonFromSchema();
    this.validateSchema();

    // Clear selection if removed field was selected
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(null);
    }
  }

  // Move field up
  protected moveFieldUp(index: number): void {
    if (index === 0) return;

    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    const fields = [...currentFields];
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];

    this.schema.set({
      ...currentSchema,
      fields
    });

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index - 1);
    }
  }

  // Move field down
  protected moveFieldDown(index: number): void {
    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    if (index === currentFields.length - 1) return;

    const fields = [...currentFields];
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];

    this.schema.set({
      ...currentSchema,
      fields
    });

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index + 1);
    }
  }

  // Select field for editing
  protected selectField(index: number): void {
    this.selectedFieldIndex.set(index);
  }

  // Update field property
  protected updateFieldProperty(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    const updatedFields = [...currentFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [property]: value
    };

    this.schema.set({
      ...currentSchema,
      fields: updatedFields
    });

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Update schema from JSON editor
  protected onJsonChange(): void {
    try {
      const parsed = JSON.parse(this.jsonContent());
      const importResult = this.devTools.importSchema(this.jsonContent());

      if (importResult.schema) {
        this.schema.set(importResult.schema);
        this.validateSchema();
      }
    } catch (e) {
      // Invalid JSON - validation will catch it
      this.validateSchema();
    }
  }

  // Update JSON from schema
  private updateJsonFromSchema(): void {
    this.jsonContent.set(this.formattedJson());
  }

  // Validate current schema
  private validateSchema(): void {
    try {
      const schemaToValidate = this.jsonContent()
        ? JSON.parse(this.jsonContent())
        : this.schema();

      const result = this.devTools.validateSchema(schemaToValidate);
      this.validationResult.set(result);
    } catch (e) {
      this.validationResult.set({
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
      });
    }
  }

  // Export schema
  protected exportSchema(): void {
    const jsonString = this.devTools.exportSchema(this.schema());
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-schema.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import schema
  protected importSchema(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const importResult = this.devTools.importSchema(content);

      if (importResult.schema) {
        this.schema.set(importResult.schema);
        this.updateJsonFromSchema();
        this.validateSchema();
        this.selectedFieldIndex.set(null);
      } else {
        alert(`Import failed: ${importResult.error}`);
      }
    };
    reader.readAsText(file);
  }

  // Get field icon from palette
  protected getFieldIcon(fieldType: string): string {
    const template = this.fieldTemplates.find(t => t.type === fieldType);
    return template?.icon || '📝';
  }

  // Get field types as array of entries
  protected getFieldTypesEntries(fieldTypes: Record<string, number>): Array<[string, number]> {
    return Object.entries(fieldTypes);
  }

  // Toggle required validation
  protected toggleRequired(field: Field, required: boolean): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const currentFields = currentSchema.fields || [];
    const updatedFields = [...currentFields];
    updatedFields[index] = {
      ...updatedFields[index],
      validations: {
        ...field.validations,
        required
      }
    };

    this.schema.set({
      ...currentSchema,
      fields: updatedFields
    });

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Generate TypeScript interface
  protected generateTypeScript(): void {
    const tsCode = this.devTools.generateTypeScriptInterface(this.schema(), 'FormData');

    // Copy to clipboard
    navigator.clipboard.writeText(tsCode).then(() => {
      alert('TypeScript interface copied to clipboard!');
    });
  }

  // Clear form
  protected clearForm(): void {
    if (confirm('Are you sure you want to clear the entire form?')) {
      this.schema.set({
        title: 'New Form',
        description: 'Build your form by adding fields from the palette',
        fields: []
      });
      this.updateJsonFromSchema();
      this.validateSchema();
      this.selectedFieldIndex.set(null);
    }
  }
}
