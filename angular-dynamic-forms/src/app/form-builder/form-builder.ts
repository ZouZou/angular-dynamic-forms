import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';
import { DevToolsService, ValidationResult } from '../dq-dynamic-form/dev-tools.service';
import { FormSchema, Field, FormSection } from '../dq-dynamic-form/models/field.model';

interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  defaultConfig: Partial<Field>;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DqDynamicForm],
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

  // Multi-step mode
  protected readonly multiStepMode = signal<boolean>(false);

  // Selected section index (for multi-step mode)
  protected readonly selectedSectionIndex = signal<number | null>(null);

  // Active tab in property editor
  protected readonly activePropertyTab = signal<string>('basic');

  // Expose Number, JSON, Array for template (needed for numeric input conversions and JSON operations)
  protected readonly Number = Number;
  protected readonly JSON = JSON;
  protected readonly Array = Array;

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
        ],
        searchable: false
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
    },
    {
      type: 'array',
      label: 'Array/Repeater',
      icon: '🔁',
      defaultConfig: {
        type: 'array',
        name: 'arrayField',
        label: 'Repeater Field',
        arrayConfig: {
          fields: [
            {
              type: 'text',
              name: 'item',
              label: 'Item',
              placeholder: 'Enter item...'
            }
          ],
          initialItems: 1,
          minItems: 0,
          addButtonText: 'Add Item',
          removeButtonText: 'Remove'
        }
      }
    },
    {
      type: 'multiselect',
      label: 'Multi-Select',
      icon: '☑️',
      defaultConfig: {
        type: 'multiselect',
        name: 'multiselectField',
        label: 'Multi-Select',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' }
        ],
        minSelections: 1,
        maxSelections: 3,
        searchable: false
      }
    },
    {
      type: 'range',
      label: 'Range Slider',
      icon: '🎚️',
      defaultConfig: {
        type: 'range',
        name: 'rangeField',
        label: 'Range Slider',
        min: 0,
        max: 100,
        step: 1
      }
    },
    {
      type: 'color',
      label: 'Color Picker',
      icon: '🎨',
      defaultConfig: {
        type: 'color',
        name: 'colorField',
        label: 'Color Picker'
      }
    },
    {
      type: 'datetime',
      label: 'DateTime',
      icon: '📅',
      defaultConfig: {
        type: 'datetime',
        name: 'datetimeField',
        label: 'Date & Time',
        includeTime: true,
        timezone: 'America/New_York'
      }
    },
    {
      type: 'file',
      label: 'File Upload',
      icon: '📎',
      defaultConfig: {
        type: 'file',
        name: 'fileField',
        label: 'File Upload',
        accept: '*/*',
        maxFileSize: 5242880, // 5MB
        multiple: false
      }
    },
    {
      type: 'richtext',
      label: 'Rich Text',
      icon: '📝',
      defaultConfig: {
        type: 'richtext',
        name: 'richtextField',
        label: 'Rich Text Editor',
        placeholder: 'Enter text...',
        allowedFormats: ['bold', 'italic', 'underline', 'link'],
        maxCharacters: 1000
      }
    },
    {
      type: 'datatable',
      label: 'Data Table',
      icon: '📊',
      defaultConfig: {
        type: 'datatable',
        name: 'datatableField',
        label: 'Data Table',
        tableConfig: {
          columns: [
            {
              key: 'id',
              label: 'ID',
              type: 'text',
              sortable: true,
              width: '80px'
            },
            {
              key: 'name',
              label: 'Name',
              type: 'text',
              sortable: true
            },
            {
              key: 'status',
              label: 'Status',
              type: 'badge',
              sortable: true,
              badgeColorMap: {
                'active': 'success',
                'inactive': 'secondary',
                'pending': 'warning'
              }
            }
          ],
          rows: [],
          striped: true,
          bordered: true,
          hoverable: true,
          pagination: {
            enabled: true,
            rowsPerPage: 10,
            rowsPerPageOptions: [10, 25, 50, 100],
            showPageInfo: true
          },
          filter: {
            enabled: true,
            placeholder: 'Search...',
            debounceMs: 300
          },
          selection: {
            enabled: false,
            mode: 'multiple',
            showSelectAll: true
          },
          emptyMessage: 'No data available'
        }
      }
    }
  ];

  // Computed: current sections (for multi-step mode)
  protected readonly currentSections = computed(() => {
    const schema = this.schema();
    return schema.sections || [];
  });

  // Computed: current fields (based on mode)
  protected readonly currentFields = computed(() => {
    const schema = this.schema();
    const multiStep = this.multiStepMode();
    const sectionIndex = this.selectedSectionIndex();

    if (multiStep && sectionIndex !== null) {
      // In multi-step mode with a section selected, return fields from that section
      const sections = schema.sections || [];
      return sections[sectionIndex]?.fields || [];
    } else if (!multiStep) {
      // In single-step mode, return all fields
      return schema.fields || [];
    }
    return [];
  });

  // Computed: selected field
  protected readonly selectedField = computed(() => {
    const index = this.selectedFieldIndex();
    if (index === null) return null;
    const fields = this.currentFields();
    return fields[index];
  });

  // Computed: selected section
  protected readonly selectedSection = computed(() => {
    const index = this.selectedSectionIndex();
    if (index === null) return null;
    const sections = this.currentSections();
    return sections[index];
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
    // Check if schema is multi-step
    const schema = this.schema();
    if (schema.multiStep && schema.sections && schema.sections.length > 0) {
      this.multiStepMode.set(true);
      this.selectedSectionIndex.set(0);
    }
  }

  // Add field from palette
  protected addField(template: FieldTemplate): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: add to selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) {
        alert('Please select a section first');
        return;
      }

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const fieldCount = currentFields.length;

      // Create unique field name
      const newField: Field = {
        ...template.defaultConfig as Field,
        name: `${template.type}Field${fieldCount + 1}`
      };

      // Update section with new field
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: [...currentFields, newField]
      };

      this.schema.set({
        ...currentSchema,
        sections
      });

      // Select the newly added field
      this.selectedFieldIndex.set(currentFields.length);
    } else {
      // Single-step mode: add to fields array
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

      // Select the newly added field
      this.selectedFieldIndex.set(currentFields.length);
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Remove field
  protected removeField(index: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: remove from selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = currentFields.filter((_, i) => i !== index);

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: remove from fields array
      const currentFields = currentSchema.fields || [];
      const updatedFields = currentFields.filter((_, i) => i !== index);

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

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
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: move within selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const fields = [...sections[sectionIndex].fields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: move in fields array
      const currentFields = currentSchema.fields || [];
      const fields = [...currentFields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];

      this.schema.set({
        ...currentSchema,
        fields
      });
    }

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index - 1);
    }
  }

  // Move field down
  protected moveFieldDown(index: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: move within selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      if (index === currentFields.length - 1) return;

      const fields = [...currentFields];
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: move in fields array
      const currentFields = currentSchema.fields || [];
      if (index === currentFields.length - 1) return;

      const fields = [...currentFields];
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];

      this.schema.set({
        ...currentSchema,
        fields
      });
    }

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index + 1);
    }
  }

  // Select field for editing
  protected selectField(index: number): void {
    this.selectedFieldIndex.set(index);
    // Reset to basic tab when selecting a new field
    this.activePropertyTab.set('basic');
  }

  // Switch property editor tab
  protected setPropertyTab(tab: string): void {
    this.activePropertyTab.set(tab);
  }

  // Drag and drop field handler
  protected onFieldDrop(event: CdkDragDrop<Field[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: reorder within selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const fields = [...sections[sectionIndex].fields];
      moveItemInArray(fields, event.previousIndex, event.currentIndex);

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: reorder in fields array
      const fields = [...(currentSchema.fields || [])];
      moveItemInArray(fields, event.previousIndex, event.currentIndex);

      this.schema.set({
        ...currentSchema,
        fields
      });
    }

    this.updateJsonFromSchema();

    // Update selection to follow the moved field
    if (this.selectedFieldIndex() === event.previousIndex) {
      this.selectedFieldIndex.set(event.currentIndex);
    }
  }

  // Drag and drop section handler
  protected onSectionDrop(event: CdkDragDrop<FormSection[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];
    moveItemInArray(sections, event.previousIndex, event.currentIndex);

    this.schema.set({
      ...currentSchema,
      sections
    });

    this.updateJsonFromSchema();

    // Update selection to follow the moved section
    if (this.selectedSectionIndex() === event.previousIndex) {
      this.selectedSectionIndex.set(event.currentIndex);
    }
  }

  // Update field property
  protected updateFieldProperty(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    // Special handling for dependsOn - convert comma-separated string to array if multiple values
    if (property === 'dependsOn' && typeof value === 'string' && value.trim()) {
      const dependencies = value.split(',').map(d => d.trim()).filter(d => d.length > 0);
      if (dependencies.length > 1) {
        value = dependencies;
      } else if (dependencies.length === 1) {
        value = dependencies[0];
      } else {
        value = undefined;
      }
    }

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: update field in selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...updatedFields[index],
        [property]: value
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: update field in fields array
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
    }

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

        // Check if imported schema is multi-step
        if (importResult.schema.multiStep && importResult.schema.sections && importResult.schema.sections.length > 0) {
          this.multiStepMode.set(true);
          this.selectedSectionIndex.set(0);
        } else {
          this.multiStepMode.set(false);
          this.selectedSectionIndex.set(null);
        }

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

  // Get mask value for display
  protected getMaskValue(field: Field): string {
    return typeof field.mask === 'string' ? field.mask : '';
  }

  // Get field types as array of entries
  protected getFieldTypesEntries(fieldTypes: Record<string, number>): Array<[string, number]> {
    return Object.entries(fieldTypes);
  }

  // Update field property with JSON parsing
  protected updateFieldPropertyJSON(property: string, jsonValue: string): void {
    try {
      if (!jsonValue.trim()) {
        this.updateFieldProperty(property, undefined);
        return;
      }
      const parsedValue = JSON.parse(jsonValue);
      this.updateFieldProperty(property, parsedValue);
    } catch (e) {
      // Invalid JSON - ignore for now, user might still be typing
    }
  }

  // Update validation property
  protected updateValidationProperty(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      const field = updatedFields[index];

      updatedFields[index] = {
        ...field,
        validations: {
          ...field.validations,
          [property]: value
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      const field = updatedFields[index];

      updatedFields[index] = {
        ...field,
        validations: {
          ...field.validations,
          [property]: value
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Update async validator with JSON parsing
  protected updateAsyncValidatorJSON(jsonValue: string): void {
    try {
      if (!jsonValue.trim()) {
        this.updateValidationProperty('asyncValidator', undefined);
        return;
      }
      const parsedValue = JSON.parse(jsonValue);
      this.updateValidationProperty('asyncValidator', parsedValue);
    } catch (e) {
      // Invalid JSON - ignore for now, user might still be typing
    }
  }

  // Update computed field property
  protected updateComputedProperty(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      const field = updatedFields[index];

      // If formula is being cleared, remove entire computed config
      if (property === 'formula' && !value) {
        updatedFields[index] = {
          ...field,
          computed: undefined
        };
      } else {
        updatedFields[index] = {
          ...field,
          computed: {
            ...field.computed,
            formula: field.computed?.formula || '',
            dependencies: field.computed?.dependencies || [],
            [property]: value
          }
        };
      }

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      const field = updatedFields[index];

      // If formula is being cleared, remove entire computed config
      if (property === 'formula' && !value) {
        updatedFields[index] = {
          ...field,
          computed: undefined
        };
      } else {
        updatedFields[index] = {
          ...field,
          computed: {
            ...field.computed,
            formula: field.computed?.formula || '',
            dependencies: field.computed?.dependencies || [],
            [property]: value
          }
        };
      }

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Update computed dependencies from comma-separated string
  protected updateComputedDependencies(value: string): void {
    const dependencies = value
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    this.updateComputedProperty('dependencies', dependencies);
  }

  // Toggle required validation
  protected toggleRequired(field: Field, required: boolean): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      // Multi-step mode: update field in selected section
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...updatedFields[index],
        validations: {
          ...field.validations,
          required
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      // Single-step mode: update field in fields array
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
    }

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

  // Array field helpers
  protected addArraySubField(fieldIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.arrayConfig) return;

    const newSubField: Field = {
      type: 'text',
      name: `subField${(field.arrayConfig.fields?.length || 0) + 1}`,
      label: 'New Field',
      placeholder: 'Enter value...'
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: [...(field.arrayConfig.fields || []), newSubField]
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: [...(field.arrayConfig.fields || []), newSubField]
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  protected removeArraySubField(fieldIndex: number, subFieldIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.arrayConfig) return;

    const updatedSubFields = field.arrayConfig.fields?.filter((_, i) => i !== subFieldIndex) || [];

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: updatedSubFields
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: updatedSubFields
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  protected updateArraySubFieldProperty(fieldIndex: number, subFieldIndex: number, property: string, value: any): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.arrayConfig) return;

    const updatedSubFields = [...(field.arrayConfig.fields || [])];
    updatedSubFields[subFieldIndex] = {
      ...updatedSubFields[subFieldIndex],
      [property]: value
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: updatedSubFields
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          fields: updatedSubFields
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  protected updateArrayConfig(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[index];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[index];
    }

    if (!field.arrayConfig) return;

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          [property]: value
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        arrayConfig: {
          ...field.arrayConfig,
          [property]: value
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update DataTable configuration
   */
  protected updateTableConfig(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[index];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[index];
    }

    if (!field.tableConfig) return;

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          [property]: value
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          [property]: value
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update nested DataTable configuration (e.g., pagination.enabled)
   */
  protected updateTableConfigNested(parent: string, property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[index];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[index];
    }

    if (!field.tableConfig) return;

    const parentConfig = (field.tableConfig as any)[parent] || {};

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          [parent]: {
            ...parentConfig,
            [property]: value
          }
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          [parent]: {
            ...parentConfig,
            [property]: value
          }
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Add a new column to DataTable
   */
  protected addTableColumn(fieldIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig) return;

    const newColumn = {
      key: 'newColumn',
      label: 'New Column',
      type: 'text' as const,
      sortable: false
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns: [...(field.tableConfig.columns || []), newColumn]
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns: [...(field.tableConfig.columns || []), newColumn]
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Remove a column from DataTable
   */
  protected removeTableColumn(fieldIndex: number, columnIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    columns.splice(columnIndex, 1);

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update a column property in DataTable
   */
  protected updateTableColumn(fieldIndex: number, columnIndex: number, property: string, value: any): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    columns[columnIndex] = {
      ...columns[columnIndex],
      [property]: value
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update badge color map for a column
   */
  protected updateTableColumnBadgeColorMap(fieldIndex: number, columnIndex: number, jsonString: string): void {
    try {
      const colorMap = JSON.parse(jsonString);
      this.updateTableColumn(fieldIndex, columnIndex, 'badgeColorMap', colorMap);
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  /**
   * Update rows per page options
   */
  protected updateTableConfigRowsPerPageOptions(fieldIndex: number, value: string): void {
    const options = value.split(',').map(v => Number(v.trim())).filter(n => !isNaN(n) && n > 0);
    const index = fieldIndex;
    if (index === null) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[index];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[index];
    }

    if (!field.tableConfig) return;

    const pagination = field.tableConfig.pagination || { enabled: true };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          pagination: {
            ...pagination,
            rowsPerPageOptions: options
          }
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          pagination: {
            ...pagination,
            rowsPerPageOptions: options
          }
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Add action button to a DataTable column
   */
  protected addTableColumnAction(fieldIndex: number, columnIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions') return;

    const newAction = {
      label: 'New Action',
      icon: '⚡',
      type: 'button' as const,
      color: 'secondary' as const,
      onClick: 'handleAction'
    };

    columns[columnIndex] = {
      ...column,
      actions: [...(column.actions || []), newAction]
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Remove action button from a DataTable column
   */
  protected removeTableColumnAction(fieldIndex: number, columnIndex: number, actionIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions' || !column.actions) return;

    const actions = [...column.actions];
    actions.splice(actionIndex, 1);

    columns[columnIndex] = {
      ...column,
      actions
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update action button property in a DataTable column
   */
  protected updateTableColumnAction(fieldIndex: number, columnIndex: number, actionIndex: number, property: string, value: any): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions' || !column.actions) return;

    const actions = [...column.actions];
    actions[actionIndex] = {
      ...actions[actionIndex],
      [property]: value
    };

    columns[columnIndex] = {
      ...column,
      actions
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Add menu item to an action button
   */
  protected addTableColumnActionMenuItem(fieldIndex: number, columnIndex: number, actionIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions' || !column.actions) return;

    const actions = [...column.actions];
    const action = actions[actionIndex];

    const newMenuItem = {
      label: 'Menu Item',
      icon: '📋',
      onClick: 'handleMenuItem'
    };

    actions[actionIndex] = {
      ...action,
      menuItems: [...((action as any).menuItems || []), newMenuItem]
    };

    columns[columnIndex] = {
      ...column,
      actions
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Remove menu item from an action button
   */
  protected removeTableColumnActionMenuItem(fieldIndex: number, columnIndex: number, actionIndex: number, menuItemIndex: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions' || !column.actions) return;

    const actions = [...column.actions];
    const action = actions[actionIndex];
    const menuItems = [...((action as any).menuItems || [])];
    menuItems.splice(menuItemIndex, 1);

    actions[actionIndex] = {
      ...action,
      menuItems
    };

    columns[columnIndex] = {
      ...column,
      actions
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  /**
   * Update menu item property
   */
  protected updateTableColumnActionMenuItem(fieldIndex: number, columnIndex: number, actionIndex: number, menuItemIndex: number, property: string, value: any): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    let field: Field;
    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;
      const sections = currentSchema.sections || [];
      field = sections[sectionIndex].fields[fieldIndex];
    } else {
      const currentFields = currentSchema.fields || [];
      field = currentFields[fieldIndex];
    }

    if (!field.tableConfig || !field.tableConfig.columns) return;

    const columns = [...field.tableConfig.columns];
    const column = columns[columnIndex];

    if (column.type !== 'actions' || !column.actions) return;

    const actions = [...column.actions];
    const action = actions[actionIndex];
    const menuItems = [...((action as any).menuItems || [])];
    menuItems[menuItemIndex] = {
      ...menuItems[menuItemIndex],
      [property]: value
    };

    actions[actionIndex] = {
      ...action,
      menuItems
    };

    columns[columnIndex] = {
      ...column,
      actions
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: updatedFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        tableConfig: {
          ...field.tableConfig,
          columns
        }
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Clear form
  protected clearForm(): void {
    if (confirm('Are you sure you want to clear the entire form?')) {
      this.schema.set({
        title: 'New Form',
        description: 'Build your form by adding fields from the palette',
        fields: []
      });
      this.multiStepMode.set(false);
      this.updateJsonFromSchema();
      this.validateSchema();
      this.selectedFieldIndex.set(null);
      this.selectedSectionIndex.set(null);
    }
  }

  // Toggle multi-step mode
  protected toggleMultiStepMode(): void {
    const currentMode = this.multiStepMode();
    const newMode = !currentMode;

    if (newMode) {
      // Switching to multi-step mode
      const currentSchema = this.schema();
      const currentFields = currentSchema.fields || [];

      if (currentFields.length > 0) {
        // Convert existing fields to a single section
        const sections: FormSection[] = [{
          title: 'Step 1',
          description: 'Complete this section',
          icon: '📋',
          fields: [...currentFields]
        }];

        this.schema.set({
          ...currentSchema,
          multiStep: true,
          sections,
          fields: undefined
        });

        this.selectedSectionIndex.set(0);
      } else {
        // No fields, just enable multi-step mode with one empty section
        this.schema.set({
          ...currentSchema,
          multiStep: true,
          sections: [{
            title: 'Step 1',
            description: 'Complete this section',
            icon: '📋',
            fields: []
          }],
          fields: undefined
        });

        this.selectedSectionIndex.set(0);
      }
    } else {
      // Switching to single-step mode
      const currentSchema = this.schema();
      const sections = currentSchema.sections || [];

      // Flatten all fields from all sections
      const allFields: Field[] = [];
      sections.forEach(section => {
        allFields.push(...section.fields);
      });

      this.schema.set({
        ...currentSchema,
        multiStep: false,
        sections: undefined,
        fields: allFields
      });

      this.selectedSectionIndex.set(null);
    }

    this.multiStepMode.set(newMode);
    this.selectedFieldIndex.set(null);
    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Add new section
  protected addSection(): void {
    const currentSchema = this.schema();
    const sections = currentSchema.sections || [];
    const sectionNumber = sections.length + 1;

    const newSection: FormSection = {
      title: `Step ${sectionNumber}`,
      description: 'Complete this section',
      icon: '📋',
      fields: []
    };

    this.schema.set({
      ...currentSchema,
      sections: [...sections, newSection]
    });

    this.updateJsonFromSchema();
    this.validateSchema();

    // Select the new section
    this.selectedSectionIndex.set(sections.length);
  }

  // Remove section
  protected removeSection(index: number): void {
    const currentSchema = this.schema();
    const sections = currentSchema.sections || [];

    if (sections.length <= 1) {
      alert('Cannot remove the last section. Switch to single-step mode instead.');
      return;
    }

    if (!confirm('Are you sure you want to remove this section and all its fields?')) {
      return;
    }

    const updatedSections = sections.filter((_, i) => i !== index);

    this.schema.set({
      ...currentSchema,
      sections: updatedSections
    });

    this.updateJsonFromSchema();
    this.validateSchema();

    // Clear selection if removed section was selected
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(null);
    } else if (this.selectedSectionIndex() !== null && this.selectedSectionIndex()! > index) {
      // Adjust selection if it was after the removed section
      this.selectedSectionIndex.set(this.selectedSectionIndex()! - 1);
    }
  }

  // Move section up
  protected moveSectionUp(index: number): void {
    if (index === 0) return;

    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];
    [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];

    this.schema.set({
      ...currentSchema,
      sections
    });

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(index - 1);
    }
  }

  // Move section down
  protected moveSectionDown(index: number): void {
    const currentSchema = this.schema();
    const sections = currentSchema.sections || [];
    if (index === sections.length - 1) return;

    const updatedSections = [...sections];
    [updatedSections[index], updatedSections[index + 1]] = [updatedSections[index + 1], updatedSections[index]];

    this.schema.set({
      ...currentSchema,
      sections: updatedSections
    });

    this.updateJsonFromSchema();

    // Update selection
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(index + 1);
    }
  }

  // Select section
  protected selectSection(index: number): void {
    this.selectedSectionIndex.set(index);
    this.selectedFieldIndex.set(null);
  }

  // Update section property
  protected updateSectionProperty(property: string, value: any): void {
    const index = this.selectedSectionIndex();
    if (index === null) return;

    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];
    sections[index] = {
      ...sections[index],
      [property]: value
    };

    this.schema.set({
      ...currentSchema,
      sections
    });

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Move field to another section
  protected moveFieldToSection(fieldIndex: number, targetSectionIndex: number): void {
    const sourceSectionIndex = this.selectedSectionIndex();
    if (sourceSectionIndex === null || sourceSectionIndex === targetSectionIndex) return;

    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];

    // Remove field from source section
    const field = sections[sourceSectionIndex].fields[fieldIndex];
    const sourceFields = [...sections[sourceSectionIndex].fields];
    sourceFields.splice(fieldIndex, 1);

    // Add field to target section
    const targetFields = [...sections[targetSectionIndex].fields];
    targetFields.push(field);

    // Update sections
    sections[sourceSectionIndex] = {
      ...sections[sourceSectionIndex],
      fields: sourceFields
    };

    sections[targetSectionIndex] = {
      ...sections[targetSectionIndex],
      fields: targetFields
    };

    this.schema.set({
      ...currentSchema,
      sections
    });

    this.updateJsonFromSchema();
    this.validateSchema();

    // Clear field selection
    this.selectedFieldIndex.set(null);
  }

  // Update form-level properties (title, description)
  protected updateFormProperty(property: string, value: any): void {
    const currentSchema = this.schema();

    this.schema.set({
      ...currentSchema,
      [property]: value
    });

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Update submission configuration properties
  protected updateSubmissionProperty(property: string, value: any): void {
    const currentSchema = this.schema();
    const currentSubmission = currentSchema.submission || {};

    // If no submission config exists and value is undefined/empty, don't create it
    if (!currentSchema.submission && (value === undefined || value === '')) {
      return;
    }

    // Update submission config
    const updatedSubmission = {
      ...currentSubmission,
      [property]: value
    };

    // Remove undefined values to keep JSON clean
    Object.keys(updatedSubmission).forEach(key => {
      if (updatedSubmission[key as keyof typeof updatedSubmission] === undefined) {
        delete updatedSubmission[key as keyof typeof updatedSubmission];
      }
    });

    this.schema.set({
      ...currentSchema,
      submission: Object.keys(updatedSubmission).length > 0 ? updatedSubmission : undefined
    });

    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Update submission headers with JSON parsing
  protected updateSubmissionHeadersJSON(jsonValue: string): void {
    try {
      if (!jsonValue.trim()) {
        this.updateSubmissionProperty('headers', undefined);
        return;
      }
      const parsedValue = JSON.parse(jsonValue);
      this.updateSubmissionProperty('headers', parsedValue);
    } catch (e) {
      // Invalid JSON - ignore for now, user might still be typing
    }
  }

  // Update autosave configuration properties
  protected updateAutosaveProperty(property: string, value: any): void {
    const currentSchema = this.schema();
    const currentAutosave = currentSchema.autosave || { enabled: false };

    // If enabling autosave for the first time
    if (property === 'enabled' && value === true && !currentSchema.autosave) {
      this.schema.set({
        ...currentSchema,
        autosave: {
          enabled: true,
          intervalSeconds: 30,
          storage: 'localStorage',
          expirationDays: 7,
          showIndicator: true
        }
      });
    }
    // If disabling autosave
    else if (property === 'enabled' && value === false) {
      this.schema.set({
        ...currentSchema,
        autosave: undefined
      });
    }
    // Update existing autosave property
    else {
      const updatedAutosave = {
        ...currentAutosave,
        [property]: value
      };

      // Remove undefined values to keep JSON clean
      Object.keys(updatedAutosave).forEach(key => {
        if (updatedAutosave[key as keyof typeof updatedAutosave] === undefined) {
          delete updatedAutosave[key as keyof typeof updatedAutosave];
        }
      });

      this.schema.set({
        ...currentSchema,
        autosave: updatedAutosave
      });
    }

    this.updateJsonFromSchema();
    this.validateSchema();
  }
}
