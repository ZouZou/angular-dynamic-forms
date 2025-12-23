import { Component, computed, effect, inject, signal } from '@angular/core';
import { Field, FieldOption } from './models/field.model';
import { DynamicFormsService } from './dq-dynamic-form.service';

@Component({
  selector: 'dq-dynamic-form',
  imports: [],
  templateUrl: './dq-dynamic-form.html',
  styleUrl: './dq-dynamic-form.scss',
  providers: [DynamicFormsService],
})
export class DqDynamicForm {
  private readonly _formService = inject(DynamicFormsService);
  protected readonly fields = signal<Field[]>([]);
  protected readonly title = signal<string>('');
  protected readonly formValues = signal<Record<string, unknown>>({});
  protected readonly touched = signal<Record<string, boolean>>({});
  protected readonly submitted = signal(false);
  protected readonly submittedData = signal<Record<string, unknown> | null>(
    null
  );
  protected readonly loading = signal(true);

  constructor() {
    // Watch for changes in form values to reset dependent fields
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      // Find all dependent fields
      fields.forEach((field) => {
        if (field.dependsOn) {
          const parentValue = values[field.dependsOn];
          const currentValue = values[field.name];

          // Reset child field if parent changed and current value is invalid
          if (currentValue && field.optionsMap) {
            const validOptions = field.optionsMap[parentValue as string] || [];
            const isValidOption = validOptions.some(
              (opt) => opt.value === currentValue
            );

            if (!isValidOption) {
              this.formValues.update((current) => ({
                ...current,
                [field.name]: '',
              }));
            }
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this._formService.getFormSchema().subscribe((schema) => {
      this.title.set(schema.title);
      this.fields.set(schema.fields);

      const initialValues: Record<string, unknown> = {};
      const initialTouched: Record<string, boolean> = {};

      for (const field of schema.fields) {
        initialValues[field.name] = field.type === 'checkbox' ? false : '';
        initialTouched[field.name] = false;
      }

      this.formValues.set(initialValues);
      this.touched.set(initialTouched);
      this.loading.set(false);
    });
  }

  updateFormValue(fieldName: string, value: unknown): void {
    this.formValues.update((current) => ({
      ...current,
      [fieldName]: value,
    }));

    this.touched.update((current) => ({
      ...current,
      [fieldName]: true,
    }));
  }

  // Get available options for a field based on dependencies
  getAvailableOptions(field: Field): FieldOption[] {
    // If field has no dependencies, return static options
    if (!field.dependsOn || !field.optionsMap) {
      return this.normalizeOptions(field.options || []);
    }

    // Get parent field value
    const parentValue = this.formValues()[field.dependsOn];

    // Return mapped options based on parent value
    return parentValue && field.optionsMap[parentValue as string]
      ? field.optionsMap[parentValue as string]
      : [];
  }

  // Normalize options to consistent format
  normalizeOptions(options: string[] | FieldOption[]): FieldOption[] {
    if (!options.length) return [];

    // If already object format, return as is
    if (typeof options[0] === 'object') {
      return options as FieldOption[];
    }

    // Convert string array to object format
    return (options as string[]).map((opt) => ({ value: opt, label: opt }));
  }

  // Check if a field should be disabled
  isFieldDisabled(field: Field): boolean {
    // Disable if depends on another field that has no value
    return !!field.dependsOn && !this.formValues()[field.dependsOn];
  }

  // Get label for a field by name
  getLabelForField(fieldName: string): string {
    const field = this.fields().find((f) => f.name === fieldName);
    return field?.label.toLowerCase() || fieldName;
  }

  readonly errors = computed<Record<string, string>>(() => {
    const validationErrors: Record<string, string> = {};
    const values = this.formValues();
    const fields = this.fields();

    for (const field of fields) {
      const fieldValue = values[field.name]; // meaningful name
      const rules = field.validations;

      if (rules?.required && !fieldValue) {
        validationErrors[field.name] = `${field.label} is required`;
      }

      if (
        rules?.minLength &&
        typeof fieldValue === 'string' &&
        fieldValue.length < rules.minLength
      ) {
        validationErrors[
          field.name
        ] = `${field.label} must be at least ${rules.minLength} characters`;
      }

      if (rules?.requiredTrue && fieldValue !== true) {
        validationErrors[field.name] = `${field.label} must be checked`;
      }
    }

    return validationErrors;
  });

  readonly isValid = computed<boolean>(
    () => Object.keys(this.errors()).length === 0
  );

  saveUserData(): void {
    this.submittedData.set(this.formValues());
    this.submitted.set(true);
    console.log('FORM VALUES (Signals):', this.formValues());
  }
}
