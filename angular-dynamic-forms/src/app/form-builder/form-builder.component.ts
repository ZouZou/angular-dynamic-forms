import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field, FieldOption } from '../dq-dynamic-form/models/field.model';

interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
})
export class FormBuilderComponent {
  // Form configuration
  protected readonly formTitle = signal<string>('My Dynamic Form');
  protected readonly formFields = signal<Field[]>([]);
  protected readonly selectedFieldIndex = signal<number | null>(null);
  protected readonly showJsonPreview = signal<boolean>(true);
  protected readonly draggedFieldIndex = signal<number | null>(null);

  // Available field types
  protected readonly availableFieldTypes: FieldTemplate[] = [
    { type: 'text', label: 'Text Input', icon: '📝', description: 'Single-line text' },
    { type: 'email', label: 'Email', icon: '📧', description: 'Email input with validation' },
    { type: 'select', label: 'Dropdown', icon: '📋', description: 'Single select dropdown' },
    { type: 'multiselect', label: 'Multi-Select', icon: '☑️', description: 'Multiple selection dropdown' },
    { type: 'checkbox', label: 'Checkbox', icon: '✅', description: 'Boolean checkbox' },
    { type: 'range', label: 'Range Slider', icon: '🎚️', description: 'Numeric range slider' },
    { type: 'color', label: 'Color Picker', icon: '🎨', description: 'Color selection' },
    { type: 'datetime', label: 'Date & Time', icon: '📅', description: 'Date and time picker' },
    { type: 'file', label: 'File Upload', icon: '📎', description: 'File upload input' },
    { type: 'richtext', label: 'Rich Text', icon: '📄', description: 'WYSIWYG editor' },
  ];

  // Computed: Currently selected field
  protected readonly selectedField = computed<Field | null>(() => {
    const index = this.selectedFieldIndex();
    return index !== null ? this.formFields()[index] : null;
  });

  // Computed: JSON output
  protected readonly formJson = computed<string>(() => {
    const config = {
      title: this.formTitle(),
      fields: this.formFields(),
    };
    return JSON.stringify(config, null, 2);
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
    } else if (fieldType === 'color') {
      // No additional defaults needed
    } else if (fieldType === 'select' || fieldType === 'multiselect') {
      newField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ];
    } else if (fieldType === 'file') {
      newField.maxFileSize = 5242880; // 5MB
      newField.accept = '*/*';
    }

    this.formFields.update((fields) => [...fields, newField]);
    this.selectedFieldIndex.set(this.formFields().length - 1);
  }

  /**
   * Remove a field from the form
   */
  removeField(index: number): void {
    this.formFields.update((fields) => fields.filter((_, i) => i !== index));
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

    this.formFields.update((fields) => {
      const updated = [...fields];
      updated[index] = { ...updated[index], [property]: value };
      return updated;
    });
  }

  /**
   * Update field validation property
   */
  updateFieldValidation(property: string, value: any): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

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
      this.selectedFieldIndex.set(null);
    }
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

    const field = this.formFields()[index];
    if (!field.options) {
      this.updateFieldProperty('options', []);
    }

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

  /**
   * Remove option from select/multiselect field
   */
  removeOption(optionIndex: number): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

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

  /**
   * Update option
   */
  updateOption(optionIndex: number, property: 'value' | 'label', value: string): void {
    const index = this.selectedFieldIndex();
    if (index === null) return;

    this.formFields.update((fields) => {
      const updated = [...fields];
      const options = [...(updated[index].options as FieldOption[])];
      options[optionIndex] = { ...options[optionIndex], [property]: value };
      updated[index] = { ...updated[index], options };
      return updated;
    });
  }
}
