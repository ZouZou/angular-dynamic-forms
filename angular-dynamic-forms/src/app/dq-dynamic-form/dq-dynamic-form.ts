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
  // Store dynamically fetched options per field
  protected readonly dynamicOptions = signal<Record<string, FieldOption[]>>({});
  // Track loading state per field (for API-driven dropdowns)
  protected readonly fieldLoading = signal<Record<string, boolean>>({});
  // Track errors per field (for API failures)
  protected readonly fieldErrors = signal<Record<string, string>>({});
  // Track dirty state per field (has value changed from initial?)
  protected readonly dirty = signal<Record<string, boolean>>({});
  // Store initial values for dirty tracking
  private readonly initialValues = signal<Record<string, unknown>>({});

  // Computed: Check if entire form is pristine (no changes)
  protected readonly pristine = computed<boolean>(() =>
    !Object.values(this.dirty()).some(isDirty => isDirty)
  );

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

    // Watch for form value changes and fetch API options for dependent fields
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      fields.forEach((field) => {
        // Only fetch if field has API endpoint
        if (field.optionsEndpoint) {
          // For independent fields, fetch immediately
          if (!field.dependsOn) {
            this.fetchOptionsForField(field);
          }
          // For dependent fields, fetch when parent has value
          else if (values[field.dependsOn]) {
            this.fetchOptionsForField(field, values);
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
      const initialDirty: Record<string, boolean> = {};

      for (const field of schema.fields) {
        initialValues[field.name] = field.type === 'checkbox' ? false : '';
        initialTouched[field.name] = false;
        initialDirty[field.name] = false;
      }

      this.formValues.set(initialValues);
      this.touched.set(initialTouched);
      this.dirty.set(initialDirty);
      // Store initial values for comparison
      this.initialValues.set({ ...initialValues });
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

    // Track dirty state by comparing with initial value
    const initialValue = this.initialValues()[fieldName];
    const isDirty = value !== initialValue;

    this.dirty.update((current) => ({
      ...current,
      [fieldName]: isDirty,
    }));
  }

  /**
   * Fetch options from API for a field
   */
  private fetchOptionsForField(
    field: Field,
    params: Record<string, unknown> = {}
  ): void {
    if (!field.optionsEndpoint) return;

    // Set loading state
    this.fieldLoading.update((current) => ({
      ...current,
      [field.name]: true,
    }));

    // Clear any previous errors
    this.fieldErrors.update((current) => {
      const updated = { ...current };
      delete updated[field.name];
      return updated;
    });

    // Fetch options from service
    this._formService
      .fetchOptionsFromEndpoint(field.optionsEndpoint, params)
      .subscribe({
        next: (options) => {
          // Store fetched options
          this.dynamicOptions.update((current) => ({
            ...current,
            [field.name]: options,
          }));

          // Clear loading state
          this.fieldLoading.update((current) => ({
            ...current,
            [field.name]: false,
          }));
        },
        error: (error) => {
          console.error(`Error fetching options for ${field.name}:`, error);

          // Store error
          this.fieldErrors.update((current) => ({
            ...current,
            [field.name]: 'Failed to load options',
          }));

          // Clear loading state
          this.fieldLoading.update((current) => ({
            ...current,
            [field.name]: false,
          }));
        },
      });
  }

  // Get available options for a field based on dependencies
  getAvailableOptions(field: Field): FieldOption[] {
    // Priority 1: API-driven options (dynamically fetched)
    if (field.optionsEndpoint) {
      return this.dynamicOptions()[field.name] || [];
    }

    // Priority 2: Static options with dependencies (optionsMap)
    if (field.dependsOn && field.optionsMap) {
      const parentValue = this.formValues()[field.dependsOn];
      return parentValue && field.optionsMap[parentValue as string]
        ? field.optionsMap[parentValue as string]
        : [];
    }

    // Priority 3: Static options (no dependencies)
    return this.normalizeOptions(field.options || []);
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
