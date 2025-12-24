import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Field, FieldOption, VisibilityCondition, SimpleVisibilityCondition, ComplexVisibilityCondition, VisibilityOperator, ArrayFieldConfig, AsyncValidator, ComputedFieldConfig, FormSubmission } from './models/field.model';
import { DynamicFormsService } from './dq-dynamic-form.service';
import { MaskService } from './mask.service';

@Component({
  selector: 'dq-dynamic-form',
  imports: [],
  templateUrl: './dq-dynamic-form.html',
  styleUrl: './dq-dynamic-form.scss',
  providers: [DynamicFormsService],
})
export class DqDynamicForm {
  private readonly _formService = inject(DynamicFormsService);
  private readonly _maskService = inject(MaskService);
  private readonly _http = inject(HttpClient);
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

  // Autosave state
  protected readonly lastSaved = signal<Date | null>(null);
  protected readonly autosaveEnabled = signal(false);
  private autosaveTimer: any = null;
  private autosaveKey = '';
  private autosaveConfig: any = null;

  // Dynamic field arrays (repeaters) state
  // Stores the count of items for each array field
  protected readonly arrayItemCounts = signal<Record<string, number>>({});

  // Async validation state
  // Stores validation state per field: 'idle' | 'validating' | 'valid' | 'invalid'
  protected readonly asyncValidationState = signal<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  // Stores async validation error messages
  protected readonly asyncErrors = signal<Record<string, string>>({});
  // Debounce timers for async validation
  private asyncValidationTimers: Record<string, any> = {};

  // Form submission state
  protected readonly submitting = signal(false);
  protected readonly submitSuccess = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitRetryCount = signal(0);
  private submissionConfig: FormSubmission | null = null;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  // Computed: Check if entire form is pristine (no changes)
  protected readonly pristine = computed<boolean>(() =>
    !Object.values(this.dirty()).some(isDirty => isDirty)
  );

  // Computed: Last saved time formatted
  protected readonly lastSavedText = computed<string>(() => {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diff = Math.floor((now.getTime() - saved.getTime()) / 1000); // seconds

    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff / 3600)} hours ago`;
    return `Saved on ${saved.toLocaleDateString()}`;
  });

  constructor() {
    // Watch for changes in form values to reset dependent fields
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      // Find all dependent fields
      fields.forEach((field) => {
        if (field.dependsOn && typeof field.dependsOn === 'string') {
          // Only handle single string dependencies here (for optionsMap)
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
          // For dependent fields, fetch when ALL dependencies have values
          else if (this.allDependenciesHaveValues(field)) {
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
        // Only process checkbox dependencies (single dependency only)
        if (
          field.type === 'checkbox' &&
          field.dependsOn &&
          typeof field.dependsOn === 'string' &&
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

    // Autosave effect: save draft when form values change
    effect(() => {
      const values = this.formValues();
      const isDirty = !this.pristine();

      // Only autosave if enabled, form is dirty, and form is not submitted
      if (this.autosaveEnabled() && isDirty && !this.submitted()) {
        // Debounce autosave to avoid excessive writes
        this.debouncedAutosave();
      }
    });

    // Computed fields effect: recalculate when dependencies change
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      fields.forEach(field => {
        if (field.computed) {
          const newValue = this.evaluateComputed(field.computed, values);
          const currentValue = values[field.name];

          // Only update if value changed to avoid infinite loops
          if (newValue !== currentValue) {
            this.formValues.update(current => ({
              ...current,
              [field.name]: newValue
            }));
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this._formService.getFormSchema().subscribe((schema) => {
      this.title.set(schema.title);

      // Handle both single-step and multi-step forms
      const allFields = schema.fields || [];
      // For multi-step forms, flatten all section fields
      if (schema.sections) {
        schema.sections.forEach(section => {
          allFields.push(...section.fields);
        });
      }

      this.fields.set(allFields);

      const initialValues: Record<string, unknown> = {};
      const initialTouched: Record<string, boolean> = {};
      const initialDirty: Record<string, boolean> = {};
      const initialArrayCounts: Record<string, number> = {};

      for (const field of allFields) {
        // Handle array fields (repeaters)
        if (field.type === 'array' && field.arrayConfig) {
          const initialItems = field.arrayConfig.initialItems || 1;
          initialArrayCounts[field.name] = initialItems;

          // Initialize values for each initial array item
          for (let i = 0; i < initialItems; i++) {
            field.arrayConfig.fields.forEach(subField => {
              const arrayFieldName = `${field.name}[${i}].${subField.name}`;
              initialValues[arrayFieldName] = this.getInitialValueForField(subField);
              initialTouched[arrayFieldName] = false;
              initialDirty[arrayFieldName] = false;
            });
          }
        } else {
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
      }

      // Set array counts
      this.arrayItemCounts.set(initialArrayCounts);

      // Check for autosave configuration
      if (schema.autosave?.enabled) {
        this.autosaveConfig = schema.autosave;
        this.autosaveKey = schema.autosave.key || `formDraft_${schema.title.replace(/\s+/g, '_')}`;
        this.autosaveEnabled.set(true);

        // Try to restore draft from storage
        const draft = this.loadDraft();
        if (draft) {
          // Merge draft values with initial values
          Object.keys(draft.values).forEach(key => {
            if (initialValues.hasOwnProperty(key)) {
              initialValues[key] = draft.values[key];
            }
          });
          this.lastSaved.set(new Date(draft.timestamp));
          console.log('Draft restored from', this.autosaveConfig.storage || 'localStorage');
        }

        // Set up periodic autosave if interval is configured
        if (schema.autosave.intervalSeconds) {
          this.autosaveTimer = setInterval(() => {
            if (!this.pristine() && !this.submitted()) {
              this.saveDraft();
            }
          }, schema.autosave.intervalSeconds * 1000);
        }
      }

      // Store submission configuration
      if (schema.submission) {
        this.submissionConfig = schema.submission;
      }

      this.formValues.set(initialValues);
      this.touched.set(initialTouched);
      this.dirty.set(initialDirty);
      // Store initial values for comparison
      this.initialValues.set({ ...initialValues });
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    // Clear autosave timer
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
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

    // Trigger async validation if configured
    const field = this.fields().find(f => f.name === fieldName ||
      fieldName.startsWith(f.name + '['));
    if (field?.validations?.asyncValidator && value) {
      this.triggerAsyncValidation(fieldName, value, field.validations.asyncValidator);
    } else {
      // Clear async validation if no value
      this.clearAsyncValidation(fieldName);
    }
  }

  /**
   * Update form value with mask applied
   */
  updateMaskedFormValue(fieldName: string, rawValue: string, field: Field): void {
    if (!field.mask) {
      this.updateFormValue(fieldName, rawValue);
      return;
    }

    // Get max allowed length for this mask
    const maxLength = this._maskService.getMaxLength(field.mask);

    // Truncate input if it exceeds max length (handles paste operations)
    let truncatedValue = rawValue;
    if (maxLength && rawValue.length > maxLength) {
      truncatedValue = rawValue.substring(0, maxLength);
    }

    // Apply mask to display value
    const maskedValue = this._maskService.applyMask(truncatedValue, field.mask);

    // Store masked value for display
    this.formValues.update((current) => ({
      ...current,
      [fieldName]: maskedValue,
    }));

    this.touched.update((current) => ({
      ...current,
      [fieldName]: true,
    }));

    // Track dirty state
    const initialValue = this.initialValues()[fieldName];
    const isDirty = maskedValue !== initialValue;

    this.dirty.update((current) => ({
      ...current,
      [fieldName]: isDirty,
    }));

    // For validation, use raw (unmasked) value
    const rawForValidation = this._maskService.getRawValue(maskedValue, field.mask);
    if (field.validations?.asyncValidator && rawForValidation) {
      this.triggerAsyncValidation(fieldName, rawForValidation, field.validations.asyncValidator);
    } else {
      this.clearAsyncValidation(fieldName);
    }
  }

  /**
   * Get mask pattern for display
   */
  getMaskPattern(field: Field): string {
    if (!field.mask) return '';
    return this._maskService.getMaskPattern(field.mask);
  }

  /**
   * Get max length for masked input field
   */
  getMaxLength(field: Field): number | undefined {
    if (!field.mask) return undefined;
    return this._maskService.getMaxLength(field.mask);
  }

  /**
   * Evaluate computed field formula
   */
  private evaluateComputed(config: ComputedFieldConfig, values: Record<string, unknown>): unknown {
    try {
      // Replace field names in formula with their values
      let formula = config.formula;

      // Sort dependencies by length (longest first) to avoid partial replacements
      const sortedDeps = [...config.dependencies].sort((a, b) => b.length - a.length);

      sortedDeps.forEach(dep => {
        const value = values[dep];
        // Handle different value types
        if (typeof value === 'string') {
          formula = formula.replace(new RegExp(`\\b${dep}\\b`, 'g'), `"${value}"`);
        } else if (value === null || value === undefined || value === '') {
          formula = formula.replace(new RegExp(`\\b${dep}\\b`, 'g'), '0');
        } else {
          formula = formula.replace(new RegExp(`\\b${dep}\\b`, 'g'), String(value));
        }
      });

      // Evaluate the formula
      // eslint-disable-next-line no-eval
      let result = eval(formula);

      // Format result based on configuration
      if (config.formatAs === 'number' || (typeof result === 'number' && config.formatAs !== 'text')) {
        if (typeof result === 'number') {
          const decimal = config.decimal ?? 2;
          result = result.toFixed(decimal);
        }
      }

      if (config.formatAs === 'currency') {
        if (typeof result === 'number') {
          const decimal = config.decimal ?? 2;
          result = result.toFixed(decimal);
          result = result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
      }

      // Add prefix/suffix
      if (config.prefix) {
        result = config.prefix + result;
      }
      if (config.suffix) {
        result = result + config.suffix;
      }

      return result;
    } catch (error) {
      console.error('Error evaluating computed field:', error, config.formula);
      return '';
    }
  }

  /**
   * Trigger async validation for a field
   */
  private triggerAsyncValidation(fieldName: string, value: unknown, validator: AsyncValidator): void {
    // Clear existing timer
    if (this.asyncValidationTimers[fieldName]) {
      clearTimeout(this.asyncValidationTimers[fieldName]);
    }

    // Set validating state
    this.asyncValidationState.update(state => ({
      ...state,
      [fieldName]: 'validating'
    }));

    // Debounce the validation
    const debounceMs = validator.debounceMs || 300;
    this.asyncValidationTimers[fieldName] = setTimeout(() => {
      this.performAsyncValidation(fieldName, value, validator);
    }, debounceMs);
  }

  /**
   * Perform async validation via API
   */
  private performAsyncValidation(fieldName: string, value: unknown, validator: AsyncValidator): void {
    const method = validator.method || 'POST';
    const validWhen = validator.validWhen || 'custom';

    // Make API call
    this._formService.validateFieldAsync(validator.endpoint, { value, fieldName }, method)
      .subscribe({
        next: (response: any) => {
          let isValid = false;
          let errorMessage = validator.errorMessage || 'Invalid value';

          if (validWhen === 'exists') {
            isValid = !!response.exists;
          } else if (validWhen === 'notExists') {
            isValid = !response.exists;
          } else {
            // 'custom' - expect { valid: boolean, message?: string }
            isValid = response.valid === true;
            if (response.message) {
              errorMessage = response.message;
            }
          }

          if (isValid) {
            this.asyncValidationState.update(state => ({
              ...state,
              [fieldName]: 'valid'
            }));
            this.asyncErrors.update(errors => {
              const updated = { ...errors };
              delete updated[fieldName];
              return updated;
            });
          } else {
            this.asyncValidationState.update(state => ({
              ...state,
              [fieldName]: 'invalid'
            }));
            this.asyncErrors.update(errors => ({
              ...errors,
              [fieldName]: errorMessage
            }));
          }
        },
        error: (error) => {
          console.error(`Async validation error for ${fieldName}:`, error);
          this.asyncValidationState.update(state => ({
            ...state,
            [fieldName]: 'invalid'
          }));
          this.asyncErrors.update(errors => ({
            ...errors,
            [fieldName]: 'Validation failed. Please try again.'
          }));
        }
      });
  }

  /**
   * Clear async validation state for a field
   */
  private clearAsyncValidation(fieldName: string): void {
    // Clear timer
    if (this.asyncValidationTimers[fieldName]) {
      clearTimeout(this.asyncValidationTimers[fieldName]);
      delete this.asyncValidationTimers[fieldName];
    }

    // Reset state
    this.asyncValidationState.update(state => {
      const updated = { ...state };
      delete updated[fieldName];
      return updated;
    });

    this.asyncErrors.update(errors => {
      const updated = { ...errors };
      delete updated[fieldName];
      return updated;
    });
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

    // Build dependency parameters if field has dependencies
    const dependencyParams = field.dependsOn ? this.buildDependencyParams(field, params) : {};

    // Replace template variables in endpoint URL with actual values
    const endpoint = this.replaceTemplateVariables(field.optionsEndpoint, { ...params, ...dependencyParams });

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
      .fetchOptionsFromEndpoint(endpoint, dependencyParams)
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

    // Priority 2: Static options with dependencies (optionsMap - single dependency only)
    if (field.dependsOn && typeof field.dependsOn === 'string' && field.optionsMap) {
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
    // Disable if depends on other fields and not all dependencies have values
    return !!field.dependsOn && !this.allDependenciesHaveValues(field);
  }

  // Get label for a field by name
  getLabelForField(fieldName: string): string {
    const field = this.fields().find((f) => f.name === fieldName);
    return field?.label.toLowerCase() || fieldName;
  }

  /**
   * Get the number of items for an array field
   */
  getArrayItemCount(fieldName: string): number {
    return this.arrayItemCounts()[fieldName] || 0;
  }

  /**
   * Get array of indices for an array field
   */
  getArrayIndices(fieldName: string): number[] {
    const count = this.getArrayItemCount(fieldName);
    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Add a new item to an array field
   */
  addArrayItem(field: Field): void {
    if (!field.arrayConfig) return;

    const currentCount = this.getArrayItemCount(field.name);
    const maxItems = field.arrayConfig.maxItems;

    // Check if we can add more items
    if (maxItems && currentCount >= maxItems) {
      return;
    }

    // Increment count
    this.arrayItemCounts.update(counts => ({
      ...counts,
      [field.name]: currentCount + 1
    }));

    // Initialize values for new array item's fields
    const newIndex = currentCount;
    field.arrayConfig.fields.forEach(subField => {
      const arrayFieldName = `${field.name}[${newIndex}].${subField.name}`;

      this.formValues.update(current => ({
        ...current,
        [arrayFieldName]: this.getInitialValueForField(subField)
      }));

      this.touched.update(current => ({
        ...current,
        [arrayFieldName]: false
      }));

      this.dirty.update(current => ({
        ...current,
        [arrayFieldName]: false
      }));

      // Store initial value
      this.initialValues.update(current => ({
        ...current,
        [arrayFieldName]: this.getInitialValueForField(subField)
      }));
    });
  }

  /**
   * Remove an item from an array field
   */
  removeArrayItem(field: Field, index: number): void {
    if (!field.arrayConfig) return;

    const currentCount = this.getArrayItemCount(field.name);
    const minItems = field.arrayConfig.minItems || 0;

    // Check if we can remove items
    if (currentCount <= minItems) {
      return;
    }

    // Remove values for this array item
    field.arrayConfig.fields.forEach(subField => {
      const arrayFieldName = `${field.name}[${index}].${subField.name}`;

      this.formValues.update(current => {
        const updated = { ...current };
        delete updated[arrayFieldName];
        return updated;
      });

      this.touched.update(current => {
        const updated = { ...current };
        delete updated[arrayFieldName];
        return updated;
      });

      this.dirty.update(current => {
        const updated = { ...current };
        delete updated[arrayFieldName];
        return updated;
      });

      this.initialValues.update(current => {
        const updated = { ...current };
        delete updated[arrayFieldName];
        return updated;
      });
    });

    // Shift all subsequent items down
    for (let i = index + 1; i < currentCount; i++) {
      field.arrayConfig.fields.forEach(subField => {
        const oldKey = `${field.name}[${i}].${subField.name}`;
        const newKey = `${field.name}[${i - 1}].${subField.name}`;

        const values = this.formValues();
        const touchedState = this.touched();
        const dirtyState = this.dirty();
        const initialVals = this.initialValues();

        this.formValues.update(current => {
          const updated = { ...current };
          updated[newKey] = values[oldKey];
          delete updated[oldKey];
          return updated;
        });

        this.touched.update(current => {
          const updated = { ...current };
          updated[newKey] = touchedState[oldKey];
          delete updated[oldKey];
          return updated;
        });

        this.dirty.update(current => {
          const updated = { ...current };
          updated[newKey] = dirtyState[oldKey];
          delete updated[oldKey];
          return updated;
        });

        this.initialValues.update(current => {
          const updated = { ...current };
          updated[newKey] = initialVals[oldKey];
          delete updated[oldKey];
          return updated;
        });
      });
    }

    // Decrement count
    this.arrayItemCounts.update(counts => ({
      ...counts,
      [field.name]: currentCount - 1
    }));
  }

  /**
   * Get initial value for a field based on its type
   */
  private getInitialValueForField(field: Field): unknown {
    if (field.type === 'checkbox') {
      return false;
    } else if (field.type === 'number') {
      return field.min ?? 0;
    } else {
      return '';
    }
  }

  /**
   * Get the field name for an array item's sub-field
   */
  getArrayFieldName(arrayFieldName: string, index: number, subFieldName: string): string {
    return `${arrayFieldName}[${index}].${subFieldName}`;
  }

  /**
   * Check if add button should be disabled for an array field
   */
  canAddArrayItem(field: Field): boolean {
    if (!field.arrayConfig) return false;
    const currentCount = this.getArrayItemCount(field.name);
    const maxItems = field.arrayConfig.maxItems;
    return !maxItems || currentCount < maxItems;
  }

  /**
   * Check if remove button should be disabled for an array field
   */
  canRemoveArrayItem(field: Field): boolean {
    if (!field.arrayConfig) return false;
    const currentCount = this.getArrayItemCount(field.name);
    const minItems = field.arrayConfig.minItems || 0;
    return currentCount > minItems;
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
    const asyncErrs = this.asyncErrors();

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

      // Cross-field validation: matchesField (e.g., password confirmation)
      if (rules?.matchesField) {
        const matchFieldValue = values[rules.matchesField];
        const matchField = fields.find(f => f.name === rules.matchesField);
        const matchFieldLabel = matchField?.label.toLowerCase() || rules.matchesField;

        if (fieldValue && matchFieldValue && fieldValue !== matchFieldValue) {
          validationErrors[field.name] = rules.customMessage ||
            `${field.label} must match ${matchFieldLabel}`;
        }
      }

      // Cross-field validation: requiredIf (conditional required)
      if (rules?.requiredIf) {
        const conditionField = rules.requiredIf.field;
        const conditionValue = values[conditionField];
        const { operator, value } = rules.requiredIf;

        let conditionMet = false;
        switch (operator) {
          case 'equals':
            conditionMet = conditionValue === value;
            break;
          case 'notEquals':
            conditionMet = conditionValue !== value;
            break;
          case 'greaterThan':
            conditionMet = typeof conditionValue === 'number' && typeof value === 'number' && conditionValue > value;
            break;
          case 'lessThan':
            conditionMet = typeof conditionValue === 'number' && typeof value === 'number' && conditionValue < value;
            break;
          case 'isEmpty':
            conditionMet = !conditionValue || conditionValue === '';
            break;
          case 'isNotEmpty':
            conditionMet = !!conditionValue && conditionValue !== '';
            break;
          default:
            conditionMet = false;
        }

        if (conditionMet && !fieldValue) {
          const condField = fields.find(f => f.name === conditionField);
          const condFieldLabel = condField?.label.toLowerCase() || conditionField;
          validationErrors[field.name] = rules.customMessage ||
            `${field.label} is required when ${condFieldLabel} ${operator === 'equals' ? 'is' : operator === 'notEquals' ? 'is not' : operator} ${value}`;
        }
      }

      // Cross-field validation: greaterThanField (for dates/numbers)
      if (rules?.greaterThanField) {
        const compareFieldValue = values[rules.greaterThanField];
        const compareField = fields.find(f => f.name === rules.greaterThanField);
        const compareFieldLabel = compareField?.label.toLowerCase() || rules.greaterThanField;

        if (fieldValue && compareFieldValue) {
          let isInvalid = false;

          if (field.type === 'date' && typeof fieldValue === 'string' && typeof compareFieldValue === 'string') {
            isInvalid = new Date(fieldValue) <= new Date(compareFieldValue);
          } else if (field.type === 'number') {
            const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue as string);
            const compareNumValue = typeof compareFieldValue === 'number' ? compareFieldValue : parseFloat(compareFieldValue as string);
            isInvalid = numValue <= compareNumValue;
          }

          if (isInvalid) {
            validationErrors[field.name] = rules.customMessage ||
              `${field.label} must be after ${compareFieldLabel}`;
          }
        }
      }

      // Cross-field validation: lessThanField (for dates/numbers)
      if (rules?.lessThanField) {
        const compareFieldValue = values[rules.lessThanField];
        const compareField = fields.find(f => f.name === rules.lessThanField);
        const compareFieldLabel = compareField?.label.toLowerCase() || rules.lessThanField;

        if (fieldValue && compareFieldValue) {
          let isInvalid = false;

          if (field.type === 'date' && typeof fieldValue === 'string' && typeof compareFieldValue === 'string') {
            isInvalid = new Date(fieldValue) >= new Date(compareFieldValue);
          } else if (field.type === 'number') {
            const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue as string);
            const compareNumValue = typeof compareFieldValue === 'number' ? compareFieldValue : parseFloat(compareFieldValue as string);
            isInvalid = numValue >= compareNumValue;
          }

          if (isInvalid) {
            validationErrors[field.name] = rules.customMessage ||
              `${field.label} must be before ${compareFieldLabel}`;
          }
        }
      }

      // Custom pattern validation
      if (rules?.pattern && fieldValue && typeof fieldValue === 'string') {
        const regex = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern;
        if (!regex.test(fieldValue)) {
          validationErrors[field.name] = rules.customMessage ||
            `${field.label} format is invalid`;
        }
      }

      // Mask validation - check if masked value is complete
      if (field.mask && fieldValue && typeof fieldValue === 'string') {
        if (!this._maskService.isValidMaskedValue(fieldValue, field.mask)) {
          validationErrors[field.name] = this._maskService.getMaskValidationError(field.mask);
        }
      }
    }

    // Merge async validation errors
    return { ...validationErrors, ...asyncErrs };
  });

  readonly isValid = computed<boolean>(() => {
    // Check if there are any validation errors
    if (Object.keys(this.errors()).length > 0) {
      return false;
    }

    // Check if any async validations are in progress
    const asyncStates = Object.values(this.asyncValidationState());
    const hasValidating = asyncStates.some(state => state === 'validating');

    return !hasValidating;
  });

  saveUserData(): void {
    // Check if form is valid
    if (!this.isValid()) {
      // Focus on first field with error for better accessibility
      this.focusFirstError();
      return;
    }

    // Reset submission state
    this.submitError.set(null);
    this.submitSuccess.set(false);

    // If no submission config, just show data locally
    if (!this.submissionConfig?.endpoint) {
      this.submittedData.set(this.formValues());
      this.submitted.set(true);
      this.submitSuccess.set(true);
      console.log('FORM VALUES (Signals):', this.formValues());

      // Clear draft on successful submission
      if (this.autosaveEnabled()) {
        this.clearDraft();
      }
      return;
    }

    // Submit to API with retry logic
    this.submitToApi(0);
  }

  /**
   * Submit form data to API with retry logic
   */
  private submitToApi(attemptNumber: number): void {
    if (!this.submissionConfig?.endpoint) return;

    this.submitting.set(true);
    this.submitRetryCount.set(attemptNumber);

    const method = this.submissionConfig.method || 'POST';
    const headers = this.submissionConfig.headers || {};
    const formData = this.formValues();

    // Make HTTP request
    const request$ = method === 'POST'
      ? this._http.post(this.submissionConfig.endpoint, formData, { headers })
      : method === 'PUT'
        ? this._http.put(this.submissionConfig.endpoint, formData, { headers })
        : this._http.patch(this.submissionConfig.endpoint, formData, { headers });

    request$.subscribe({
      next: (response) => {
        this.handleSubmitSuccess(response);
      },
      error: (error: HttpErrorResponse) => {
        this.handleSubmitError(error, attemptNumber);
      }
    });
  }

  /**
   * Handle successful form submission
   */
  private handleSubmitSuccess(response: any): void {
    this.submitting.set(false);
    this.submitSuccess.set(true);
    this.submitted.set(true);
    this.submittedData.set(response);

    // Clear draft on successful submission
    if (this.autosaveEnabled()) {
      this.clearDraft();
    }

    console.log('Form submitted successfully:', response);

    // Handle redirect if configured
    if (this.submissionConfig?.redirectOnSuccess) {
      setTimeout(() => {
        window.location.href = this.submissionConfig!.redirectOnSuccess!;
      }, 2000); // 2 second delay to show success message
    }
  }

  /**
   * Handle form submission error with retry logic
   */
  private handleSubmitError(error: HttpErrorResponse, attemptNumber: number): void {
    console.error('Form submission error:', error);

    // Check if we should retry
    if (attemptNumber < this.MAX_RETRY_ATTEMPTS && (error.status === 0 || error.status >= 500)) {
      // Network error or server error - retry after delay
      const retryDelay = Math.pow(2, attemptNumber) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`Retrying submission in ${retryDelay}ms (attempt ${attemptNumber + 1}/${this.MAX_RETRY_ATTEMPTS})`);

      setTimeout(() => {
        this.submitToApi(attemptNumber + 1);
      }, retryDelay);
    } else {
      // Max retries reached or client error - show error
      this.submitting.set(false);

      // Extract error message
      let errorMessage = this.submissionConfig?.errorMessage || 'Form submission failed. Please try again.';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      // Handle field-level errors from API
      if (error.error?.errors && typeof error.error.errors === 'object') {
        // Merge field-level errors into asyncErrors for display
        this.asyncErrors.update(current => ({
          ...current,
          ...error.error.errors
        }));
      }

      this.submitError.set(errorMessage);
    }
  }

  /**
   * Retry form submission (called from template)
   */
  retrySubmit(): void {
    this.submitToApi(0);
  }

  /**
   * Focus on the first field with a validation error (accessibility)
   */
  private focusFirstError(): void {
    const errors = this.errors();
    const firstErrorField = Object.keys(errors)[0];

    if (firstErrorField) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          // Scroll to element if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  /**
   * Save current form state to storage
   */
  private saveDraft(): void {
    if (!this.autosaveKey) return;

    const draft = {
      values: this.formValues(),
      timestamp: new Date().toISOString(),
      expiresAt: this.autosaveConfig?.expirationDays
        ? new Date(Date.now() + this.autosaveConfig.expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : null
    };

    const storage = this.autosaveConfig?.storage === 'sessionStorage' ? sessionStorage : localStorage;
    storage.setItem(this.autosaveKey, JSON.stringify(draft));
    this.lastSaved.set(new Date());
  }

  /**
   * Load draft from storage
   */
  private loadDraft(): { values: Record<string, unknown>; timestamp: string } | null {
    if (!this.autosaveKey) return null;

    const storage = this.autosaveConfig?.storage === 'sessionStorage' ? sessionStorage : localStorage;
    const draftStr = storage.getItem(this.autosaveKey);

    if (!draftStr) return null;

    try {
      const draft = JSON.parse(draftStr);

      // Check if draft has expired
      if (draft.expiresAt && new Date(draft.expiresAt) < new Date()) {
        this.clearDraft();
        return null;
      }

      return draft;
    } catch (e) {
      console.error('Failed to parse draft:', e);
      return null;
    }
  }

  /**
   * Clear draft from storage
   */
  private clearDraft(): void {
    if (!this.autosaveKey) return;

    const storage = this.autosaveConfig?.storage === 'sessionStorage' ? sessionStorage : localStorage;
    storage.removeItem(this.autosaveKey);
    this.lastSaved.set(null);
  }

  /**
   * Debounced autosave to avoid excessive writes
   */
  private debounceTimer: any = null;
  private debouncedAutosave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveDraft();
    }, 1000); // Wait 1 second after last change before saving
  }

  /**
   * Get dependencies for a field as an array
   * Normalizes both single dependency (string) and multiple dependencies (string[])
   */
  private getDependencies(field: Field): string[] {
    if (!field.dependsOn) return [];
    return Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
  }

  /**
   * Check if all dependencies of a field have values
   */
  private allDependenciesHaveValues(field: Field): boolean {
    if (!field.dependsOn) return true;

    const dependencies = this.getDependencies(field);
    const values = this.formValues();

    return dependencies.every(dep => {
      const value = values[dep];
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Build parameters object for API calls, replacing template variables
   * Supports both {{fieldName}} syntax in URLs and plain parameter passing
   */
  private buildDependencyParams(field: Field, values: Record<string, unknown>): Record<string, unknown> {
    const dependencies = this.getDependencies(field);
    const params: Record<string, unknown> = {};

    dependencies.forEach(dep => {
      params[dep] = values[dep];
    });

    return params;
  }

  /**
   * Replace template variables in endpoint URL with actual values
   * Supports {{fieldName}} syntax
   */
  private replaceTemplateVariables(endpoint: string, values: Record<string, unknown>): string {
    let result = endpoint;

    // Find all {{variable}} patterns and replace with actual values
    const matches = endpoint.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches.forEach(match => {
        const fieldName = match.replace(/\{\{|\}\}/g, '');
        const value = values[fieldName];
        if (value !== undefined && value !== null) {
          result = result.replace(match, String(value));
        }
      });
    }

    return result;
  }
}
