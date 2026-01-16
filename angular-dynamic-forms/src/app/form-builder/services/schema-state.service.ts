import { Injectable, signal, computed } from '@angular/core';
import { FormSchema, Field, FormSection } from 'dq-dynamic-form';

/**
 * Service for managing form schema state and operations
 */
@Injectable({
  providedIn: 'root'
})
export class SchemaStateService {
  // Current form schema being built
  readonly schema = signal<FormSchema>({
    title: 'New Form',
    description: 'Build your form by adding fields from the palette',
    fields: []
  });

  // Multi-step mode
  readonly multiStepMode = signal<boolean>(false);

  // Selected field index for editing
  readonly selectedFieldIndex = signal<number | null>(null);

  // Selected section index (for multi-step mode)
  readonly selectedSectionIndex = signal<number | null>(null);

  // Computed: Current fields (either from selected section or root)
  readonly currentFields = computed(() => {
    const schema = this.schema();
    const multiStep = this.multiStepMode();
    const sectionIndex = this.selectedSectionIndex();

    if (multiStep && sectionIndex !== null) {
      const sections = schema.sections || [];
      return sections[sectionIndex]?.fields || [];
    }

    return schema.fields || [];
  });

  // Computed: Currently selected field
  readonly selectedField = computed(() => {
    const index = this.selectedFieldIndex();
    if (index === null) return null;
    return this.currentFields()[index] || null;
  });

  /**
   * Set the entire schema
   */
  setSchema(schema: FormSchema): void {
    this.schema.set(schema);

    // Check if schema is multi-step
    if (schema.multiStep && schema.sections && schema.sections.length > 0) {
      this.multiStepMode.set(true);
      this.selectedSectionIndex.set(0);
    } else {
      this.multiStepMode.set(false);
      this.selectedSectionIndex.set(null);
    }
  }

  /**
   * Add a field to the current context (section or root)
   */
  addField(field: Field): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) {
        throw new Error('Please select a section first');
      }

      const sections = [...(currentSchema.sections || [])];
      const currentFields = sections[sectionIndex].fields;

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: [...currentFields, field]
      };

      this.schema.set({
        ...currentSchema,
        sections
      });

      this.selectedFieldIndex.set(currentFields.length);
    } else {
      const currentFields = currentSchema.fields || [];

      this.schema.set({
        ...currentSchema,
        fields: [...currentFields, field]
      });

      this.selectedFieldIndex.set(currentFields.length);
    }
  }

  /**
   * Remove a field by index
   */
  removeField(index: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
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
      const currentFields = currentSchema.fields || [];
      const updatedFields = currentFields.filter((_, i) => i !== index);

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }

    // Clear selection if removed field was selected
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(null);
    }
  }

  /**
   * Update a property of the selected field
   */
  updateFieldProperty(property: string, value: unknown): void {
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
      const currentFields = currentSchema.fields || [];
      const updatedFields = [...currentFields];
      const field = updatedFields[index];

      updatedFields[index] = {
        ...field,
        [property]: value
      };

      this.schema.set({
        ...currentSchema,
        fields: updatedFields
      });
    }
  }

  /**
   * Update a validation property of the selected field
   */
  updateValidationProperty(property: string, value: unknown): void {
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
  }

  /**
   * Move field up in the list
   */
  moveFieldUp(index: number): void {
    if (index === 0) return;

    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = [...sections[sectionIndex].fields];
      [currentFields[index - 1], currentFields[index]] = [currentFields[index], currentFields[index - 1]];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: currentFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = [...(currentSchema.fields || [])];
      [currentFields[index - 1], currentFields[index]] = [currentFields[index], currentFields[index - 1]];

      this.schema.set({
        ...currentSchema,
        fields: currentFields
      });
    }

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index - 1);
    }
  }

  /**
   * Move field down in the list
   */
  moveFieldDown(index: number): void {
    const currentSchema = this.schema();
    const multiStep = this.multiStepMode();
    const fields = multiStep
      ? (currentSchema.sections?.[this.selectedSectionIndex()!]?.fields || [])
      : (currentSchema.fields || []);

    if (index === fields.length - 1) return;

    if (multiStep) {
      const sectionIndex = this.selectedSectionIndex();
      if (sectionIndex === null) return;

      const sections = [...(currentSchema.sections || [])];
      const currentFields = [...sections[sectionIndex].fields];
      [currentFields[index], currentFields[index + 1]] = [currentFields[index + 1], currentFields[index]];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        fields: currentFields
      };

      this.schema.set({
        ...currentSchema,
        sections
      });
    } else {
      const currentFields = [...(currentSchema.fields || [])];
      [currentFields[index], currentFields[index + 1]] = [currentFields[index + 1], currentFields[index]];

      this.schema.set({
        ...currentSchema,
        fields: currentFields
      });
    }

    // Update selection
    if (this.selectedFieldIndex() === index) {
      this.selectedFieldIndex.set(index + 1);
    }
  }

  /**
   * Add a new section
   */
  addSection(): void {
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
      multiStep: true,
      sections: [...sections, newSection]
    });

    this.multiStepMode.set(true);
    this.selectedSectionIndex.set(sections.length);
  }

  /**
   * Remove a section
   */
  removeSection(index: number): void {
    const currentSchema = this.schema();
    const sections = currentSchema.sections || [];

    if (sections.length <= 1) {
      throw new Error('Cannot remove the last section. Switch to single-step mode instead.');
    }

    const updatedSections = sections.filter((_, i) => i !== index);

    this.schema.set({
      ...currentSchema,
      sections: updatedSections
    });

    // Clear selection if removed section was selected
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(null);
    } else if (this.selectedSectionIndex() !== null && this.selectedSectionIndex()! > index) {
      // Adjust selection if it was after the removed section
      this.selectedSectionIndex.set(this.selectedSectionIndex()! - 1);
    }
  }

  /**
   * Move section up
   */
  moveSectionUp(index: number): void {
    if (index === 0) return;

    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];
    [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];

    this.schema.set({
      ...currentSchema,
      sections
    });

    // Update selection
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(index - 1);
    }
  }

  /**
   * Move section down
   */
  moveSectionDown(index: number): void {
    const currentSchema = this.schema();
    const sections = currentSchema.sections || [];
    if (index === sections.length - 1) return;

    const updatedSections = [...sections];
    [updatedSections[index], updatedSections[index + 1]] = [updatedSections[index + 1], updatedSections[index]];

    this.schema.set({
      ...currentSchema,
      sections: updatedSections
    });

    // Update selection
    if (this.selectedSectionIndex() === index) {
      this.selectedSectionIndex.set(index + 1);
    }
  }

  /**
   * Update section property
   */
  updateSectionProperty(sectionIndex: number, property: string, value: unknown): void {
    const currentSchema = this.schema();
    const sections = [...(currentSchema.sections || [])];

    sections[sectionIndex] = {
      ...sections[sectionIndex],
      [property]: value
    };

    this.schema.set({
      ...currentSchema,
      sections
    });
  }

  /**
   * Toggle multi-step mode
   */
  toggleMultiStepMode(): void {
    const currentSchema = this.schema();
    const newMode = !this.multiStepMode();

    if (newMode) {
      // Switching to multi-step: create first section with existing fields
      const firstSection: FormSection = {
        title: 'Step 1',
        description: 'Complete this section',
        icon: '📋',
        fields: currentSchema.fields || []
      };

      this.schema.set({
        ...currentSchema,
        multiStep: true,
        sections: [firstSection],
        fields: []
      });

      this.multiStepMode.set(true);
      this.selectedSectionIndex.set(0);
    } else {
      // Switching to single-step: flatten all section fields
      const sections = currentSchema.sections || [];
      const allFields = sections.flatMap(section => section.fields);

      this.schema.set({
        ...currentSchema,
        multiStep: false,
        fields: allFields,
        sections: undefined
      });

      this.multiStepMode.set(false);
      this.selectedSectionIndex.set(null);
    }

    this.selectedFieldIndex.set(null);
  }
}
