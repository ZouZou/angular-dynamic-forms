import { Component, signal, computed, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';
import { DevToolsService, ValidationResult } from '../dq-dynamic-form/dev-tools.service';
import { FormSchema, Field, FormSection } from '../dq-dynamic-form/models/field.model';
import { SchemaStateService } from './services/schema-state.service';
import { SchemaIOService } from './services/schema-io.service';
import { FieldPaletteComponent, FieldTemplate } from './components/palette/field-palette.component';
import { SchemaTreeComponent } from './components/schema-tree/schema-tree.component';
import { JsonEditorPanelComponent } from './components/json-editor/json-editor-panel.component';
import { FormSettingsEditorComponent } from './components/property-editors/form-settings-editor.component';
import { SectionEditorComponent } from './components/property-editors/section-editor.component';
import { BasicFieldEditorComponent } from './components/property-editors/basic-field-editor.component';
import { ValidationEditorComponent } from './components/property-editors/validation-editor.component';
import { AdvancedFieldEditorComponent } from './components/property-editors/advanced-field-editor.component';
import { ArrayConfigEditorComponent } from './components/property-editors/array-config-editor.component';
import { DatatableConfigEditorComponent } from './components/property-editors/datatable-config-editor.component';
import { TimelineConfigEditorComponent } from './components/property-editors/timeline-config-editor.component';

@Component({
  selector: 'app-form-builder',
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    DqDynamicForm,
    FieldPaletteComponent,
    SchemaTreeComponent,
    JsonEditorPanelComponent,
    FormSettingsEditorComponent,
    SectionEditorComponent,
    BasicFieldEditorComponent,
    ValidationEditorComponent,
    AdvancedFieldEditorComponent,
    ArrayConfigEditorComponent,
    DatatableConfigEditorComponent,
    TimelineConfigEditorComponent
  ],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormBuilder {
  private readonly devTools = inject(DevToolsService);
  protected readonly schemaState = inject(SchemaStateService);
  protected readonly schemaIO = inject(SchemaIOService);

  // Expose schema signals from service
  protected readonly schema = this.schemaState.schema;
  protected readonly selectedFieldIndex = this.schemaState.selectedFieldIndex;
  protected readonly multiStepMode = this.schemaState.multiStepMode;
  protected readonly selectedSectionIndex = this.schemaState.selectedSectionIndex;

  // Expose IO signals from service
  protected readonly jsonContent = this.schemaIO.jsonContent;
  protected readonly validationResult = this.schemaIO.validationResult;

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
    },
    {
      type: 'timeline',
      label: 'Timeline',
      icon: '📅',
      defaultConfig: {
        type: 'timeline',
        name: 'timelineField',
        label: 'Timeline',
        timelineConfig: {
          items: [
            {
              id: 1,
              title: 'Project Started',
              description: 'Initial project kickoff and planning phase',
              timestamp: '2025-01-01',
              status: 'completed',
              icon: '✓',
              badge: {
                label: 'MILESTONE',
                color: 'primary'
              }
            },
            {
              id: 2,
              title: 'Development Phase',
              description: 'Core functionality implementation',
              timestamp: '2025-02-01',
              status: 'in-progress',
              icon: '⚙️',
              badge: {
                label: 'IN PROGRESS',
                color: 'warning'
              }
            },
            {
              id: 3,
              title: 'Testing & QA',
              description: 'Quality assurance and testing phase',
              timestamp: '2025-03-01',
              status: 'pending',
              icon: '🧪'
            },
            {
              id: 4,
              title: 'Launch',
              description: 'Production deployment',
              timestamp: '2025-04-01',
              status: 'pending',
              icon: '🚀'
            }
          ],
          style: {
            layout: 'vertical',
            alignment: 'left',
            markerStyle: 'icon',
            lineStyle: 'solid',
            cardStyle: false,
            dense: false,
            animated: true
          },
          interaction: {
            clickable: false,
            expandable: false,
            hoverable: true
          },
          dateFormat: 'MMM DD, YYYY',
          showConnector: true,
          sortOrder: 'asc',
          emptyMessage: 'No timeline items'
        }
      }
    }
  ];

  // Computed: current sections (for multi-step mode)
  protected readonly currentSections = computed(() => {
    const schema = this.schema();
    return schema.sections || [];
  });

  // Computed: current fields (use service)
  protected readonly currentFields = this.schemaState.currentFields;

  // Computed: selected field (use service)
  protected readonly selectedField = this.schemaState.selectedField;

  // Computed: selected section
  protected readonly selectedSection = computed(() => {
    const index = this.selectedSectionIndex();
    if (index === null) return null;
    const sections = this.currentSections();
    return sections[index];
  });

  // Computed: formatted JSON
  protected readonly formattedJson = computed(() => {
    return this.schemaIO.formatSchema(this.schema());
  });

  // Computed: field icon map for schema tree
  protected readonly fieldIconMap = computed(() => {
    const map = new Map<string, string>();
    this.fieldTemplates.forEach(template => {
      map.set(template.type, template.icon);
    });
    return map;
  });

  // Initialization effect
  private readonly initializationEffect = effect(() => {
    // Initialize JSON content
    this.updateJsonFromSchema();
    // Initial validation
    this.validateSchema();
  });

  // Add field from palette
  protected addField(template: FieldTemplate): void {
    try {
      const currentFields = this.currentFields();
      const fieldCount = currentFields.length;

      // Create unique field name
      const newField: Field = {
        ...template.defaultConfig as Field,
        name: `${template.type}Field${fieldCount + 1}`
      };

      // Add field using service
      this.schemaState.addField(newField);

      this.updateJsonFromSchema();
      this.validateSchema();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // Remove field
  protected removeField(index: number): void {
    this.schemaState.removeField(index);
    this.updateJsonFromSchema();
    this.validateSchema();
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

    this.schemaState.updateFieldProperty(property, value);
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

  // Handle JSON content change from editor component
  protected onJsonContentChanged(newContent: string): void {
    this.schemaIO.setJsonContent(newContent);
    this.onJsonChange();
  }

  // Update JSON from schema
  private updateJsonFromSchema(): void {
    this.schemaIO.setJsonContent(this.formattedJson());
  }

  // Validate current schema
  private validateSchema(): void {
    this.schemaIO.validateSchema(this.schema(), this.jsonContent());
  }

  // Export schema
  protected exportSchema(): void {
    this.schemaIO.exportSchema(this.schema());
  }

  // Import schema
  protected async importSchema(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const importResult = await this.schemaIO.importSchemaFromFile(file);

    if (importResult.schema) {
      this.schemaState.setSchema(importResult.schema);
      this.updateJsonFromSchema();
      this.validateSchema();
    } else {
      alert(`Import failed: ${importResult.error}`);
    }
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
    this.schemaState.updateValidationProperty(property, value);
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
  protected async generateTypeScript(): Promise<void> {
    await this.schemaIO.copyTypeScriptToClipboard(this.schema());
    alert('TypeScript interface copied to clipboard!');
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

  /**
   * Update Timeline configuration (top-level properties)
   */
  protected updateTimelineConfig(property: string, value: any): void {
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

    if (!field.timelineConfig) return;

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        timelineConfig: {
          ...field.timelineConfig,
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
        timelineConfig: {
          ...field.timelineConfig,
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
   * Update Timeline style configuration
   */
  protected updateTimelineStyle(property: string, value: any): void {
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

    if (!field.timelineConfig) return;

    const style = field.timelineConfig.style || {};

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        timelineConfig: {
          ...field.timelineConfig,
          style: {
            ...style,
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
        timelineConfig: {
          ...field.timelineConfig,
          style: {
            ...style,
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
   * Update Timeline interaction configuration
   */
  protected updateTimelineInteraction(property: string, value: any): void {
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

    if (!field.timelineConfig) return;

    const interaction = field.timelineConfig.interaction || {};

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[index] = {
        ...field,
        timelineConfig: {
          ...field.timelineConfig,
          interaction: {
            ...interaction,
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
        timelineConfig: {
          ...field.timelineConfig,
          interaction: {
            ...interaction,
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
   * Add a new timeline item
   */
  protected addTimelineItem(fieldIndex: number): void {
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

    if (!field.timelineConfig) return;

    const newItem = {
      id: Date.now(),
      title: 'New Item',
      description: 'Item description',
      timestamp: new Date().toISOString(),
      icon: '📌',
      status: 'pending' as const
    };

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        timelineConfig: {
          ...field.timelineConfig,
          items: [...(field.timelineConfig.items || []), newItem]
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
        timelineConfig: {
          ...field.timelineConfig,
          items: [...(field.timelineConfig.items || []), newItem]
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
   * Remove a timeline item
   */
  protected removeTimelineItem(fieldIndex: number, itemIndex: number): void {
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

    if (!field.timelineConfig || !field.timelineConfig.items) return;

    const items = field.timelineConfig.items.filter((_: any, i: number) => i !== itemIndex);

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...field,
        timelineConfig: {
          ...field.timelineConfig,
          items
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
        timelineConfig: {
          ...field.timelineConfig,
          items
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
   * Update a timeline item property
   */
  protected updateTimelineItem(fieldIndex: number, itemIndex: number, property: string, value: any): void {
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

    if (!field.timelineConfig?.items) return;

    const items = [...field.timelineConfig.items];
    items[itemIndex] = {
      ...items[itemIndex],
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
        timelineConfig: {
          ...field.timelineConfig,
          items
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
        timelineConfig: {
          ...field.timelineConfig,
          items
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
    this.schemaState.toggleMultiStepMode();
    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Add new section
  protected addSection(): void {
    this.schemaState.addSection();
    this.updateJsonFromSchema();
    this.validateSchema();
  }

  // Remove section
  protected removeSection(index: number): void {
    if (!confirm('Are you sure you want to remove this section and all its fields?')) {
      return;
    }

    try {
      this.schemaState.removeSection(index);
      this.updateJsonFromSchema();
      this.validateSchema();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // Move section up
  protected moveSectionUp(index: number): void {
    this.schemaState.moveSectionUp(index);
    this.updateJsonFromSchema();
  }

  // Move section down
  protected moveSectionDown(index: number): void {
    this.schemaState.moveSectionDown(index);
    this.updateJsonFromSchema();
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

    this.schemaState.updateSectionProperty(index, property, value);
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
