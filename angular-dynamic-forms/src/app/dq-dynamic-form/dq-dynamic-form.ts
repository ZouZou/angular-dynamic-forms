import { Component, computed, effect, inject, signal } from '@angular/core';
import { Field, FieldOption, VisibilityCondition, SimpleVisibilityCondition, ComplexVisibilityCondition, VisibilityOperator } from './models/field.model';
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
  // Track programmatic updates to prevent infinite loops in checkbox dependencies
  private readonly isUpdatingProgrammatically = signal<Set<string>>(new Set());

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

    // Watch for checkbox dependencies ('same' or 'opposite' relationships)
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();
      const updatingFields = this.isUpdatingProgrammatically();

      fields.forEach((field) => {
        // Only process checkbox dependencies
        if (
          field.type === 'checkbox' &&
          field.dependsOn &&
          field.dependencyType
        ) {
          const currentValue = values[field.name] as boolean;
          const dependentValue = values[field.dependsOn] as boolean;

          // Skip if this field is being updated programmatically to prevent loops
          if (updatingFields.has(field.name)) {
            return;
          }

          // Determine the expected value based on dependency type
          let expectedValue: boolean;
          if (field.dependencyType === 'same') {
            expectedValue = dependentValue;
          } else {
            // 'opposite'
            expectedValue = !dependentValue;
          }

          // Update if values don't match expected relationship
          if (currentValue !== expectedValue) {
            this.updateCheckboxProgrammatically(field.name, expectedValue);
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
        // Set appropriate initial values based on field type
        if (field.type === 'checkbox') {
          initialValues[field.name] = false;
        } else if (field.type === 'number') {
          initialValues[field.name] = field.min ?? 0;
        } else {
          initialValues[field.name] = '';
        }
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
   * Update checkbox value programmatically (used for dependencies)
   * Prevents infinite loops by marking the field as being updated programmatically
   */
  private updateCheckboxProgrammatically(
    fieldName: string,
    value: boolean
  ): void {
    // Mark this field as being updated programmatically
    this.isUpdatingProgrammatically.update((current) => {
      const updated = new Set(current);
      updated.add(fieldName);
      return updated;
    });

    // Update the value
    this.formValues.update((current) => ({
      ...current,
      [fieldName]: value,
    }));

    // Track dirty state
    const initialValue = this.initialValues()[fieldName];
    const isDirty = value !== initialValue;

    this.dirty.update((current) => ({
      ...current,
      [fieldName]: isDirty,
    }));

    // Clear the programmatic update flag after a brief delay
    // This allows the effect to complete before allowing user updates again
    setTimeout(() => {
      this.isUpdatingProgrammatically.update((current) => {
        const updated = new Set(current);
        updated.delete(fieldName);
        return updated;
      });
    }, 0);
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

  /**
   * Check if a field should be visible based on visibility conditions
   */
  isFieldVisible(field: Field): boolean {
    if (!field.visibleWhen) {
      return true; // No visibility condition, always visible
    }

    return this.evaluateVisibilityCondition(field.visibleWhen);
  }

  /**
   * Evaluate a visibility condition (simple or complex)
   */
  private evaluateVisibilityCondition(condition: VisibilityCondition): boolean {
    // Check if it's a complex condition (has 'and' or 'or' operator)
    if ('conditions' in condition) {
      return this.evaluateComplexCondition(condition as ComplexVisibilityCondition);
    }

    // It's a simple condition
    return this.evaluateSimpleCondition(condition as SimpleVisibilityCondition);
  }

  /**
   * Evaluate a complex visibility condition with AND/OR logic
   */
  private evaluateComplexCondition(condition: ComplexVisibilityCondition): boolean {
    const results = condition.conditions.map((c) =>
      this.evaluateVisibilityCondition(c)
    );

    if (condition.operator === 'and') {
      return results.every((r) => r === true);
    } else {
      // 'or'
      return results.some((r) => r === true);
    }
  }

  /**
   * Evaluate a simple visibility condition
   */
  private evaluateSimpleCondition(condition: SimpleVisibilityCondition): boolean {
    const fieldValue = this.formValues()[condition.field];
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;

      case 'notEquals':
        return fieldValue !== value;

      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof value === 'string' &&
          fieldValue.includes(value)
        );

      case 'notContains':
        return (
          typeof fieldValue === 'string' &&
          typeof value === 'string' &&
          !fieldValue.includes(value)
        );

      case 'greaterThan':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue > value
        );

      case 'lessThan':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue < value
        );

      case 'greaterThanOrEqual':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue >= value
        );

      case 'lessThanOrEqual':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue <= value
        );

      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);

      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);

      case 'isEmpty':
        return (
          fieldValue === '' ||
          fieldValue === null ||
          fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );

      case 'isNotEmpty':
        return !(
          fieldValue === '' ||
          fieldValue === null ||
          fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );

      default:
        console.warn(`Unknown visibility operator: ${operator}`);
        return true;
    }
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

      // Email validation
      if (field.type === 'email' && fieldValue && typeof fieldValue === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fieldValue)) {
          validationErrors[field.name] = `${field.label} must be a valid email address`;
        }
      }

      // Number validation (min/max)
      if (field.type === 'number' && fieldValue !== '' && fieldValue !== null) {
        const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue as string);

        if (field.min !== undefined && numValue < field.min) {
          validationErrors[field.name] = `${field.label} must be at least ${field.min}`;
        }

        if (field.max !== undefined && numValue > field.max) {
          validationErrors[field.name] = `${field.label} must be at most ${field.max}`;
        }
      }

      // Date validation (min/max)
      if (field.type === 'date' && fieldValue && typeof fieldValue === 'string') {
        const dateValue = new Date(fieldValue);

        if (field.min && new Date(field.min) > dateValue) {
          validationErrors[field.name] = `${field.label} must be on or after ${field.min}`;
        }

        if (field.max && new Date(field.max) < dateValue) {
          validationErrors[field.name] = `${field.label} must be on or before ${field.max}`;
        }
      }

      // Textarea validation (same as text - maxLength)
      if (
        field.type === 'textarea' &&
        rules?.maxLength &&
        typeof fieldValue === 'string' &&
        fieldValue.length > rules.maxLength
      ) {
        validationErrors[
          field.name
        ] = `${field.label} must be at most ${rules.maxLength} characters`;
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
