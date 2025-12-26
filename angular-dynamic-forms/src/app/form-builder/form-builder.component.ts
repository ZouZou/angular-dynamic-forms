import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field, FieldOption, FormSchema, FormSection } from '../dq-dynamic-form/models/field.model';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';

interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DqDynamicForm],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
})
export class FormBuilderComponent {
  // Form configuration
  protected readonly formTitle = signal<string>('My Dynamic Form');
  protected readonly formFields = signal<Field[]>([]);
  protected readonly selectedFieldIndex = signal<number | null>(null);
  protected readonly showJsonPreview = signal<boolean>(false);
  protected readonly showLivePreview = signal<boolean>(true);
  protected readonly draggedFieldIndex = signal<number | null>(null);

  // Multi-step configuration
  protected readonly multiStepEnabled = signal<boolean>(false);
  protected readonly sections = signal<FormSection[]>([]);
  protected readonly currentSection = signal<number>(0);
  protected readonly selectedSectionIndex = signal<number | null>(null);

  // Expose Number for template (needed for numeric input conversions)
  protected readonly Number = Number;

  // Available field types
  protected readonly availableFieldTypes: FieldTemplate[] = [
    { type: 'text', label: 'Text Input', icon: '📝', description: 'Single-line text' },
    { type: 'email', label: 'Email', icon: '📧', description: 'Email input with validation' },
    { type: 'password', label: 'Password', icon: '🔒', description: 'Password input field' },
    { type: 'textarea', label: 'Text Area', icon: '📃', description: 'Multi-line text input' },
    { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric input field' },
    { type: 'date', label: 'Date', icon: '📆', description: 'Date picker' },
    { type: 'datetime', label: 'Date & Time', icon: '📅', description: 'Date and time picker' },
    { type: 'select', label: 'Dropdown', icon: '📋', description: 'Single select dropdown' },
    { type: 'multiselect', label: 'Multi-Select', icon: '☑️', description: 'Multiple selection dropdown' },
    { type: 'radio', label: 'Radio Buttons', icon: '🔘', description: 'Radio button group' },
    { type: 'checkbox', label: 'Checkbox', icon: '✅', description: 'Boolean checkbox' },
    { type: 'range', label: 'Range Slider', icon: '🎚️', description: 'Numeric range slider' },
    { type: 'color', label: 'Color Picker', icon: '🎨', description: 'Color selection' },
    { type: 'file', label: 'File Upload', icon: '📎', description: 'File upload input' },
    { type: 'richtext', label: 'Rich Text', icon: '📄', description: 'WYSIWYG editor' },
    { type: 'array', label: 'Repeater', icon: '🔁', description: 'Dynamic field array' },
  ];

  // Computed: Currently selected field
  protected readonly selectedField = computed<Field | null>(() => {
    const index = this.selectedFieldIndex();
    const fields = this.getCurrentFields();
    return index !== null ? fields[index] : null;
  });

  // Computed: Form schema for live preview
  protected readonly formSchema = computed<FormSchema>(() => {
    if (this.multiStepEnabled()) {
      return {
        title: this.formTitle(),
        multiStep: true,
        sections: this.sections(),
      };
    } else {
      return {
        title: this.formTitle(),
        fields: this.formFields(),
      };
    }
  });

  // Computed: JSON output
  protected readonly formJson = computed<string>(() => {
    return JSON.stringify(this.formSchema(), null, 2);
  });

  /**
   * Add a new field to the form
   */
  addField(fieldType: string): void {
    const newField: Field = {
      type: fieldType,
      label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      name: `field_${Date.now()}`,
      validations: {},
    };

    // Set default values based on type
    if (fieldType === 'range') {
      newField.min = 0;
      newField.max = 100;
      newField.step = 1;
    } else if (fieldType === 'number') {
      newField.min = 0;
      newField.max = 100;
      newField.step = 1;
    } else if (fieldType === 'date' || fieldType === 'datetime') {
      // Date fields can optionally have min/max set later
    } else if (fieldType === 'textarea') {
      newField.rows = 4;
    } else if (fieldType === 'select' || fieldType === 'multiselect' || fieldType === 'radio') {
      newField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ];
    } else if (fieldType === 'file') {
      newField.maxFileSize = 5242880; // 5MB
      newField.accept = '*/*';
    } else if (fieldType === 'array') {
      newField.arrayConfig = {
        fields: [
          {
            type: 'text',
            name: 'item',
            label: 'Item',
            validations: {},
          },
        ],
        minItems: 1,
        maxItems: 10,
        initialItems: 1,
      };
    }

    if (this.multiStepEnabled()) {
      // Add to current section
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          fields: [...updated[sectionIndex].fields, newField],
        };
        return updated;
      });
      this.selectedFieldIndex.set(this.sections()[sectionIndex].fields.length - 1);
    } else {
      // Add to flat fields
      this.formFields.update((fields) => [...fields, newField]);
      this.selectedFieldIndex.set(this.formFields().length - 1);
    }
  }

  /**
   * Remove a field from the form
   */
  removeField(index: number): void {
    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          fields: updated[sectionIndex].fields.filter((_, i) => i !== index),
        };
        return updated;
      });
    } else {
      this.formFields.update((fields) => fields.filter((_, i) => i !== index));
    }

    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(null);
    }
  }

  /**
   * Select a field for editing
   */
  selectField(index: number): void {
    this.selectedFieldIndex.set(index);
  }

  /**
   * Update field property
   */
  updateFieldProperty(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const fields = [...updated[sectionIndex].fields];
        fields[index] = { ...fields[index], [property]: value };
        updated[sectionIndex] = { ...updated[sectionIndex], fields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [property]: value };
        return updated;
      });
    }
  }

  /**
   * Update field validation property
   */
  updateFieldValidation(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const fields = [...updated[sectionIndex].fields];
        fields[index] = {
          ...fields[index],
          validations: {
            ...fields[index].validations,
            [property]: value,
          },
        };
        updated[sectionIndex] = { ...updated[sectionIndex], fields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        updated[index] = {
          ...updated[index],
          validations: {
            ...updated[index].validations,
            [property]: value,
          },
        };
        return updated;
      });
    }
  }

  /**
   * Toggle JSON preview
   */
  toggleJsonPreview(): void {
    this.showJsonPreview.update((show) => !show);
  }

  /**
   * Export form configuration as JSON file
   */
  exportConfig(): void {
    const config = {
      title: this.formTitle(),
      fields: this.formFields(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import form configuration from JSON file
   */
  importConfig(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.title) this.formTitle.set(config.title);
        if (config.fields) this.formFields.set(config.fields);
        alert('Configuration imported successfully!');
      } catch (error) {
        alert('Error importing configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Copy JSON to clipboard
   */
  copyToClipboard(): void {
    navigator.clipboard.writeText(this.formJson());
    alert('JSON copied to clipboard!');
  }

  /**
   * Clear all fields
   */
  clearForm(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.formFields.set([]);
      this.sections.set([]);
      this.selectedFieldIndex.set(null);
      this.selectedSectionIndex.set(null);
    }
  }

  /**
   * Get current fields based on mode
   */
  getCurrentFields(): Field[] {
    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      const sections = this.sections();
      return sectionIndex < sections.length ? sections[sectionIndex].fields : [];
    } else {
      return this.formFields();
    }
  }

  /**
   * Toggle multi-step mode
   */
  toggleMultiStep(): void {
    const enabled = !this.multiStepEnabled();
    this.multiStepEnabled.set(enabled);

    if (enabled) {
      // Convert current fields to first section
      const currentFields = this.formFields();
      this.sections.set([
        {
          title: 'Step 1',
          description: 'First step of the form',
          fields: currentFields,
        },
      ]);
      this.currentSection.set(0);
      this.formFields.set([]);
    } else {
      // Convert sections back to flat fields
      const allFields: Field[] = [];
      this.sections().forEach((section) => allFields.push(...section.fields));
      this.formFields.set(allFields);
      this.sections.set([]);
      this.currentSection.set(0);
    }
    this.selectedFieldIndex.set(null);
  }

  /**
   * Add a new section
   */
  addSection(): void {
    const newSection: FormSection = {
      title: `Step ${this.sections().length + 1}`,
      description: 'New step',
      fields: [],
    };
    this.sections.update((sections) => [...sections, newSection]);
  }

  /**
   * Remove a section
   */
  removeSection(index: number): void {
    if (this.sections().length <= 1) {
      alert('You must have at least one section in a multi-step form');
      return;
    }
    if (confirm('Are you sure you want to remove this section?')) {
      this.sections.update((sections) => sections.filter((_, i) => i !== index));
      if (this.currentSection() >= this.sections().length) {
        this.currentSection.set(this.sections().length - 1);
      }
    }
  }

  /**
   * Update section property
   */
  updateSectionProperty(index: number, property: string, value: any): void {
    this.sections.update((sections) => {
      const updated = [...sections];
      updated[index] = { ...updated[index], [property]: value };
      return updated;
    });
  }

  /**
   * Select a section
   */
  selectSection(index: number): void {
    this.currentSection.set(index);
    this.selectedFieldIndex.set(null);
  }

  /**
   * Toggle live preview
   */
  toggleLivePreview(): void {
    this.showLivePreview.update((show) => !show);
  }

  /**
   * Drag and drop handlers
   */
  onDragStart(index: number): void {
    this.draggedFieldIndex.set(index);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const draggedIndex = this.draggedFieldIndex();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    this.formFields.update((fields) => {
      const updated = [...fields];
      const [draggedField] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, draggedField);
      return updated;
    });

    this.draggedFieldIndex.set(null);
  }

  /**
   * Add option to select/multiselect field
   */
  addOption(): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    const fields = this.getCurrentFields();
    const field = fields[index];
    if (!field.options) {
      this.updateFieldProperty('options', []);
    }

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const sectionFields = [...updated[sectionIndex].fields];
        const options = sectionFields[index].options as FieldOption[] || [];
        sectionFields[index] = {
          ...sectionFields[index],
          options: [
            ...options,
            { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` },
          ],
        };
        updated[sectionIndex] = { ...updated[sectionIndex], fields: sectionFields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        const options = updated[index].options as FieldOption[] || [];
        updated[index] = {
          ...updated[index],
          options: [
            ...options,
            { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` },
          ],
        };
        return updated;
      });
    }
  }

  /**
   * Remove option from select/multiselect field
   */
  removeOption(optionIndex: number): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const sectionFields = [...updated[sectionIndex].fields];
        const options = sectionFields[index].options as FieldOption[];
        sectionFields[index] = {
          ...sectionFields[index],
          options: options.filter((_, i) => i !== optionIndex),
        };
        updated[sectionIndex] = { ...updated[sectionIndex], fields: sectionFields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        const options = updated[index].options as FieldOption[];
        updated[index] = {
          ...updated[index],
          options: options.filter((_, i) => i !== optionIndex),
        };
        return updated;
      });
    }
  }

  /**
   * Update option
   */
  updateOption(optionIndex: number, property: 'value' | 'label', value: string): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const sectionFields = [...updated[sectionIndex].fields];
        const options = [...(sectionFields[index].options as FieldOption[])];
        options[optionIndex] = { ...options[optionIndex], [property]: value };
        sectionFields[index] = { ...sectionFields[index], options };
        updated[sectionIndex] = { ...updated[sectionIndex], fields: sectionFields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        const options = [...(updated[index].options as FieldOption[])];
        options[optionIndex] = { ...options[optionIndex], [property]: value };
        updated[index] = { ...updated[index], options };
        return updated;
      });
    }
  }

  /**
   * Update array configuration property
   */
  updateArrayConfig(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    if (this.multiStepEnabled()) {
      const sectionIndex = this.currentSection();
      this.sections.update((sections) => {
        const updated = [...sections];
        const sectionFields = [...updated[sectionIndex].fields];
        const currentArrayConfig = sectionFields[index].arrayConfig || {
          fields: [],
          minItems: 1,
          maxItems: 10,
          initialItems: 1,
        };
        sectionFields[index] = {
          ...sectionFields[index],
          arrayConfig: {
            ...currentArrayConfig,
            [property]: value,
          },
        };
        updated[sectionIndex] = { ...updated[sectionIndex], fields: sectionFields };
        return updated;
      });
    } else {
      this.formFields.update((fields) => {
        const updated = [...fields];
        const currentArrayConfig = updated[index].arrayConfig || {
          fields: [],
          minItems: 1,
          maxItems: 10,
          initialItems: 1,
        };
        updated[index] = {
          ...updated[index],
          arrayConfig: {
            ...currentArrayConfig,
            [property]: value,
          },
        };
        return updated;
      });
    }
  }
}
