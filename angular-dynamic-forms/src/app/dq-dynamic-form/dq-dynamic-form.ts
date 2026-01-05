import { Component, computed, effect, inject, signal, input } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { Field, FieldOption, VisibilityCondition, SimpleVisibilityCondition, ComplexVisibilityCondition, VisibilityOperator, ArrayFieldConfig, AsyncValidator, ComputedFieldConfig, FormSubmission, FormSchema, FormSection, ValueTransform, DataTableColumn, DataTableRow, DataTableConfig, DataTableAction, DataTableActionMenuItem } from './models/field.model';
import { DynamicFormsService } from './dq-dynamic-form.service';
import { MaskService } from './mask.service';
import { I18nService } from './i18n.service';

@Component({
  selector: 'dq-dynamic-form',
  imports: [NgSelectModule, FormsModule],
  templateUrl: './dq-dynamic-form.html',
  styleUrl: './dq-dynamic-form.scss',
  providers: [DynamicFormsService],
  animations: [
    trigger('fieldAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class DqDynamicForm {
  // Optional input for providing schema directly (used by form builder)
  formSchema = input<FormSchema | null>(null);

  // Optional input for dynamically setting the submission endpoint
  submissionEndpoint = input<string | null>(null);

  private readonly _formService = inject(DynamicFormsService);
  private readonly _maskService = inject(MaskService);
  private readonly _http = inject(HttpClient);
  protected readonly _i18nService = inject(I18nService);
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
  // Store file data for file uploads
  protected readonly fileData = signal<Record<string, any>>({});

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

  // Multi-step form state
  protected readonly sections = signal<FormSection[]>([]);
  protected readonly multiStepEnabled = signal(false);
  protected readonly currentStep = signal(0);
  protected readonly completedSteps = signal<Set<number>>(new Set());

  // DataTable state
  // Store all table data (original rows before filtering/sorting)
  protected readonly tableData = signal<Record<string, any[]>>({});
  // Store current page for each table
  protected readonly tableCurrentPage = signal<Record<string, number>>({});
  // Store rows per page for each table
  protected readonly tableRowsPerPage = signal<Record<string, number>>({});
  // Store sort configuration for each table
  protected readonly tableSortConfig = signal<Record<string, { column: string; direction: 'asc' | 'desc' }>>({});
  // Store filter/search term for each table
  protected readonly tableFilterTerm = signal<Record<string, string>>({});
  // Store selected row IDs for each table
  protected readonly tableSelection = signal<Record<string, Set<string | number>>>({});
  // Store loading state for tables with API endpoints
  protected readonly tableLoading = signal<Record<string, boolean>>({});

  // Timeline state
  // Store all timeline items (original items before sorting/filtering)
  protected readonly timelineData = signal<Record<string, any[]>>({});
  // Store expanded item IDs for each timeline
  protected readonly timelineExpanded = signal<Record<string, Set<string | number>>>({});
  // Store loading state for timelines with API endpoints
  protected readonly timelineLoading = signal<Record<string, boolean>>({});
  // Store grouped timeline items (when grouping is enabled)
  protected readonly timelineGroupedData = signal<Record<string, Map<string, any[]>>>({});

  // Expose Math for template (needed for multiselect size calculation and other calculations)
  protected readonly Math = Math;

  // Expose Number for template (needed for numeric input conversions)
  protected readonly Number = Number;

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
    // Watch for changes in formSchema input (for form builder preview)
    effect(() => {
      const providedSchema = this.formSchema();
      if (providedSchema) {
        this.loadSchema(providedSchema);
      }
    });

    // Watch for changes in form values to reset dependent fields
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      // Find all dependent fields and reset them when parent changes
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

    // Value transformation effect: apply transformations when parent fields change
    effect(() => {
      const values = this.formValues();
      const fields = this.fields();

      fields.forEach(field => {
        if (field.valueTransform) {
          const transform = field.valueTransform;
          const parentValue = values[transform.dependsOn];
          const currentValue = values[field.name];

          // Determine new value based on transformation
          let newValue: any;

          if (!parentValue || parentValue === '') {
            // Parent is empty
            if (transform.clearOnEmpty !== false) {
              newValue = '';
            } else {
              return; // Don't change value
            }
          } else {
            // Convert parentValue to string key for object lookup
            const parentKey = String(parentValue);
            if (parentKey in transform.mappings) {
              // Use mapped value
              newValue = transform.mappings[parentKey];
            } else if (transform.default !== undefined) {
              // Use default value
              newValue = transform.default;
            } else {
              return; // No mapping found and no default
            }
          }

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
    // Only load from service if no schema is provided via input
    // (formSchema input changes are handled by effect in constructor)
    const providedSchema = this.formSchema();
    if (!providedSchema) {
      this._formService.getFormSchema().subscribe((schema) => {
        this.loadSchema(schema);
      });
    }
  }

  private loadSchema(schema: FormSchema): void {
    this.title.set(schema.title);

      // Handle both single-step and multi-step forms
      let allFields: Field[] = [];

      if (schema.multiStep && schema.sections && schema.sections.length > 0) {
        // Multi-step form: store sections and initialize step navigation
        this.multiStepEnabled.set(true);
        this.sections.set(schema.sections);
        this.currentStep.set(0);
        this.completedSteps.set(new Set());

        // Collect all fields from all sections for initialization
        schema.sections.forEach(section => {
          allFields.push(...section.fields);
        });
      } else {
        // Single-step form: use fields directly
        this.multiStepEnabled.set(false);
        this.sections.set([]);
        allFields = schema.fields || [];
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
          } else if (field.type === 'number' || field.type === 'range') {
            initialValues[field.name] = field.min ?? 0;
          } else if (field.type === 'multiselect') {
            initialValues[field.name] = [];
          } else if (field.type === 'color') {
            initialValues[field.name] = '#000000';
          } else if (field.type === 'file') {
            initialValues[field.name] = null;
          } else if (field.type === 'richtext') {
            initialValues[field.name] = '';
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

      // Initialize i18n if configured
      if (schema.i18n) {
        this._i18nService.initialize(schema.i18n);
      }

      // Initialize datatable fields
      allFields.forEach(field => {
        if (field.type === 'datatable' && field.tableConfig) {
          this.initializeDataTable(field);
          // Initialize empty array for selected rows
          initialValues[field.name] = [];
          initialTouched[field.name] = false;
          initialDirty[field.name] = false;
        }
      });

      // Initialize timeline fields
      allFields.forEach(field => {
        if (field.type === 'timeline' && field.timelineConfig) {
          this.initializeTimeline(field);
          // Timeline is display-only, no form value needed
          initialTouched[field.name] = false;
          initialDirty[field.name] = false;
        }
      });

      this.formValues.set(initialValues);
      this.touched.set(initialTouched);
      this.dirty.set(initialDirty);
      // Store initial values for comparison
      this.initialValues.set({ ...initialValues });
      this.loading.set(false);
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
    // Check hideUntilDependenciesMet first (takes precedence)
    if (field.hideUntilDependenciesMet && field.dependsOn) {
      // Hide field until all dependencies have values
      if (!this.allDependenciesHaveValues(field)) {
        return false;
      }
    }

    // Then check explicit visibility conditions
    if (!field.visibleWhen) {
      return true; // No visibility condition, show field
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

      // Multi-select validation
      if (field.type === 'multiselect' && Array.isArray(fieldValue)) {
        if (field.minSelections && fieldValue.length < field.minSelections) {
          validationErrors[field.name] = `Select at least ${field.minSelections} options`;
        }
        if (field.maxSelections && fieldValue.length > field.maxSelections) {
          validationErrors[field.name] = `Select at most ${field.maxSelections} options`;
        }
      }

      // File upload validation
      if (field.type === 'file' && fieldValue) {
        const fileInfo = this.fileData()[field.name];
        if (fileInfo && field.maxFileSize && fileInfo.size > field.maxFileSize) {
          validationErrors[field.name] = `File size exceeds ${this.formatFileSize(field.maxFileSize)}`;
        }
      }

      // Rich text max characters validation
      if (field.type === 'richtext' && field.maxCharacters && fieldValue) {
        const length = this.getRichTextLength(fieldValue as string);
        if (length > field.maxCharacters) {
          validationErrors[field.name] = `Text exceeds ${field.maxCharacters} characters`;
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

    // Determine endpoint: prioritize input endpoint over schema endpoint
    const endpoint = this.submissionEndpoint() || this.submissionConfig?.endpoint;

    // If no endpoint configured, just show data locally
    if (!endpoint) {
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
    // Determine endpoint: prioritize input endpoint over schema endpoint
    const endpoint = this.submissionEndpoint() || this.submissionConfig?.endpoint;
    if (!endpoint) return;

    this.submitting.set(true);
    this.submitRetryCount.set(attemptNumber);

    const method = this.submissionConfig?.method || 'POST';
    const headers = this.submissionConfig?.headers || {};
    const formData = this.formValues();

    // Make HTTP request
    const request$ = method === 'POST'
      ? this._http.post(endpoint, formData, { headers })
      : method === 'PUT'
        ? this._http.put(endpoint, formData, { headers })
        : this._http.patch(endpoint, formData, { headers });

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

  /**
   * Update multi-select field value
   */
  updateMultiSelectValue(fieldName: string, selectedOptions: any): void {
    const values: string[] = [];
    for (let i = 0; i < selectedOptions.length; i++) {
      values.push(selectedOptions[i].value);
    }
    this.updateFormValue(fieldName, values);
  }

  /**
   * Check if a multi-select option is selected
   */
  isMultiSelectOptionSelected(fieldName: string, optionValue: string): boolean {
    const fieldValue = this.formValues()[fieldName];
    if (!Array.isArray(fieldValue)) {
      return false;
    }
    return fieldValue.includes(optionValue);
  }

  /**
   * Handle file upload
   */
  handleFileUpload(fieldName: string, files: FileList | null, field: Field): void {
    if (!files || files.length === 0) {
      this.updateFormValue(fieldName, null);
      this.fileData.update((current) => {
        const updated = { ...current };
        delete updated[fieldName];
        return updated;
      });
      return;
    }

    const file = files[0];

    // Validate file size
    if (field.maxFileSize && file.size > field.maxFileSize) {
      alert(`File size exceeds maximum allowed size of ${this.formatFileSize(field.maxFileSize)}`);
      return;
    }

    // Read file data
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fileData.update((current) => ({
        ...current,
        [fieldName]: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result,
        },
      }));
      this.updateFormValue(fieldName, file.name);
    };

    // Read as data URL for preview
    reader.readAsDataURL(file);
  }

  /**
   * Update rich text field value
   */
  updateRichTextValue(fieldName: string, html: string): void {
    this.updateFormValue(fieldName, html);
  }

  /**
   * Execute rich text command
   */
  execCommand(command: string): void {
    document.execCommand(command, false);
  }

  /**
   * Format file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  isImage(fileName: any): boolean {
    if (!fileName) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = fileName.toString().split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  }

  /**
   * Get file preview URL
   */
  getFilePreview(fieldName: string): string {
    const file = this.fileData()[fieldName];
    return file?.data || '';
  }

  /**
   * Get file name
   */
  getFileName(fileName: any): string {
    return fileName?.toString() || '';
  }

  /**
   * Get file size
   */
  getFileSize(fileName: string): string {
    const file = this.fileData()[fileName];
    return file ? this.formatFileSize(file.size) : '';
  }

  /**
   * Get rich text length (strip HTML tags)
   */
  getRichTextLength(html: string | unknown): number {
    if (!html || typeof html !== 'string') return 0;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  }

  /**
   * Switch to a different locale
   */
  switchLocale(locale: string): void {
    this._i18nService.setLocale(locale);
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string {
    return this._i18nService.getCurrentLocale();
  }

  /**
   * Get text direction for current locale
   */
  getTextDirection(): 'ltr' | 'rtl' {
    return this._i18nService.getDirection();
  }

  // ===== Multi-Step Form Methods =====

  /**
   * Get fields for the current step
   */
  protected readonly currentStepFields = computed<Field[]>(() => {
    if (!this.multiStepEnabled()) {
      return this.fields();
    }

    const sections = this.sections();
    const stepIndex = this.currentStep();

    if (stepIndex < 0 || stepIndex >= sections.length) {
      return [];
    }

    return sections[stepIndex].fields;
  });

  /**
   * Validate all fields in the current step
   */
  validateCurrentStep(): boolean {
    const stepFields = this.currentStepFields();
    const values = this.formValues();
    const errors = this.errors();

    // Check if any field in current step has errors
    for (const field of stepFields) {
      // Check for array fields
      if (field.type === 'array' && field.arrayConfig) {
        const arrayCount = this.arrayItemCounts()[field.name] || 0;
        const arrayFields: Field[] = field.arrayConfig.fields;
        for (let i = 0; i < arrayCount; i++) {
          for (const subField of arrayFields) {
            const arrayFieldName = `${field.name}[${i}].${subField.name}`;
            if (errors[arrayFieldName]) {
              return false;
            }
          }
        }
      } else {
        // Regular field
        if (errors[field.name]) {
          return false;
        }

        // Check if field is visible before validating
        if (!this.isFieldVisible(field)) {
          continue;
        }

        // Check if field is disabled
        if (this.isFieldDisabled(field)) {
          continue;
        }
      }
    }

    return true;
  }

  /**
   * Check if a specific step is complete (has no errors)
   */
  isStepComplete(stepIndex: number): boolean {
    const sections = this.sections();
    if (stepIndex < 0 || stepIndex >= sections.length) {
      return false;
    }

    return this.completedSteps().has(stepIndex);
  }

  /**
   * Go to the next step
   */
  goToNextStep(): void {
    if (!this.multiStepEnabled()) return;

    const sections = this.sections();
    const current = this.currentStep();

    // Validate current step before proceeding
    if (!this.validateCurrentStep()) {
      // Mark fields as touched to show errors
      const stepFields = this.currentStepFields();
      const touchedUpdate: Record<string, boolean> = {};

      stepFields.forEach(field => {
        if (field.type === 'array' && field.arrayConfig) {
          const arrayCount = this.arrayItemCounts()[field.name] || 0;
          for (let i = 0; i < arrayCount; i++) {
            (field.arrayConfig.fields as Field[]).forEach((subField: Field) => {
              touchedUpdate[`${field.name}[${i}].${subField.name}`] = true;
            });
          }
        } else {
          touchedUpdate[field.name] = true;
        }
      });

      this.touched.update(current => ({ ...current, ...touchedUpdate }));

      // Focus first error field
      this.focusFirstError();
      return;
    }

    // Mark current step as completed
    this.completedSteps.update(completed => {
      const newSet = new Set(completed);
      newSet.add(current);
      return newSet;
    });

    // Move to next step
    if (current < sections.length - 1) {
      this.currentStep.set(current + 1);
      this.scrollToTop();
    }
  }

  /**
   * Go to the previous step
   */
  goToPreviousStep(): void {
    if (!this.multiStepEnabled()) return;

    const current = this.currentStep();
    if (current > 0) {
      this.currentStep.set(current - 1);
      this.scrollToTop();
    }
  }

  /**
   * Go to a specific step
   */
  goToStep(stepIndex: number): void {
    if (!this.multiStepEnabled()) return;

    const sections = this.sections();
    if (stepIndex < 0 || stepIndex >= sections.length) {
      return;
    }

    // Can only jump to a step if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepComplete(i)) {
        console.warn(`Cannot jump to step ${stepIndex}. Complete previous steps first.`);
        return;
      }
    }

    this.currentStep.set(stepIndex);
    this.scrollToTop();
  }

  /**
   * Check if we can proceed to next step
   */
  canGoToNextStep(): boolean {
    if (!this.multiStepEnabled()) return false;

    const sections = this.sections();
    const current = this.currentStep();

    return current < sections.length - 1;
  }

  /**
   * Check if we can go back to previous step
   */
  canGoToPreviousStep(): boolean {
    if (!this.multiStepEnabled()) return false;
    return this.currentStep() > 0;
  }

  /**
   * Check if we're on the last step
   */
  isLastStep(): boolean {
    if (!this.multiStepEnabled()) return true;

    const sections = this.sections();
    const current = this.currentStep();

    return current === sections.length - 1;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    if (!this.multiStepEnabled()) return 100;

    const sections = this.sections();
    if (sections.length === 0) return 0;

    return Math.round(((this.currentStep() + 1) / sections.length) * 100);
  }

  /**
   * Scroll to top of form
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== DataTable Methods ====================

  /**
   * Initialize datatable field
   */
  protected initializeDataTable(field: Field): void {
    if (!field.tableConfig) return;

    const fieldName = field.name;
    const config = field.tableConfig;

    // Initialize data
    if (config.rows) {
      this.tableData.update(data => ({
        ...data,
        [fieldName]: config.rows || []
      }));
    } else if (config.dataEndpoint) {
      // Fetch data from API
      this.fetchTableData(fieldName, config.dataEndpoint);
    }

    // Initialize pagination
    const rowsPerPage = config.pagination?.rowsPerPage || 10;
    this.tableRowsPerPage.update(state => ({
      ...state,
      [fieldName]: rowsPerPage
    }));
    this.tableCurrentPage.update(state => ({
      ...state,
      [fieldName]: 1
    }));

    // Initialize sorting
    if (config.defaultSort) {
      this.tableSortConfig.update(state => ({
        ...state,
        [fieldName]: config.defaultSort!
      }));
    }

    // Initialize selection
    if (config.selection?.enabled) {
      this.tableSelection.update(state => ({
        ...state,
        [fieldName]: new Set()
      }));
    }

    // Initialize filter
    this.tableFilterTerm.update(state => ({
      ...state,
      [fieldName]: ''
    }));
  }

  /**
   * Fetch table data from API
   */
  private fetchTableData(fieldName: string, endpoint: string): void {
    this.tableLoading.update(state => ({ ...state, [fieldName]: true }));

    this._http.get<any[]>(endpoint).subscribe({
      next: (data) => {
        this.tableData.update(state => ({
          ...state,
          [fieldName]: data
        }));
        this.tableLoading.update(state => ({ ...state, [fieldName]: false }));
      },
      error: (error) => {
        console.error('Error fetching table data:', error);
        this.tableLoading.update(state => ({ ...state, [fieldName]: false }));
      }
    });
  }

  /**
   * Get processed table rows (filtered, sorted, paginated)
   */
  protected getTableRows(field: Field): DataTableRow[] {
    const fieldName = field.name;
    const config = field.tableConfig;
    if (!config) return [];

    let rows = this.tableData()[fieldName] || [];

    // Apply filtering
    const filterTerm = this.tableFilterTerm()[fieldName];
    if (filterTerm && config.filter?.enabled) {
      const searchColumns = config.filter.searchColumns || config.columns.map(c => c.key);
      rows = rows.filter(row =>
        searchColumns.some(col =>
          String(row[col] || '').toLowerCase().includes(filterTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    const sortConfig = this.tableSortConfig()[fieldName];
    if (sortConfig) {
      rows = [...rows].sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];

        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (config.pagination?.enabled !== false) {
      const currentPage = this.tableCurrentPage()[fieldName] || 1;
      const rowsPerPage = this.tableRowsPerPage()[fieldName] || 10;
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      rows = rows.slice(startIndex, endIndex);
    }

    return rows;
  }

  /**
   * Get total row count (after filtering)
   */
  protected getTableTotalRows(field: Field): number {
    const fieldName = field.name;
    const config = field.tableConfig;
    if (!config) return 0;

    let rows = this.tableData()[fieldName] || [];

    // Apply filtering
    const filterTerm = this.tableFilterTerm()[fieldName];
    if (filterTerm && config.filter?.enabled) {
      const searchColumns = config.filter.searchColumns || config.columns.map(c => c.key);
      rows = rows.filter(row =>
        searchColumns.some(col =>
          String(row[col] || '').toLowerCase().includes(filterTerm.toLowerCase())
        )
      );
    }

    return rows.length;
  }

  /**
   * Get total pages
   */
  protected getTableTotalPages(field: Field): number {
    const totalRows = this.getTableTotalRows(field);
    const rowsPerPage = this.tableRowsPerPage()[field.name] || 10;
    return Math.ceil(totalRows / rowsPerPage);
  }

  /**
   * Sort table by column
   */
  protected sortTableColumn(fieldName: string, columnKey: string): void {
    const currentSort = this.tableSortConfig()[fieldName];

    // Toggle sort direction or set new column
    const newDirection = currentSort?.column === columnKey && currentSort.direction === 'asc'
      ? 'desc'
      : 'asc';

    this.tableSortConfig.update(state => ({
      ...state,
      [fieldName]: { column: columnKey, direction: newDirection }
    }));
  }

  /**
   * Filter table data
   */
  protected filterTable(fieldName: string, term: string): void {
    this.tableFilterTerm.update(state => ({
      ...state,
      [fieldName]: term
    }));

    // Reset to first page when filtering
    this.tableCurrentPage.update(state => ({
      ...state,
      [fieldName]: 1
    }));
  }

  /**
   * Change page
   */
  protected goToTablePage(fieldName: string, page: number): void {
    this.tableCurrentPage.update(state => ({
      ...state,
      [fieldName]: page
    }));
  }

  /**
   * Change rows per page
   */
  protected changeTableRowsPerPage(fieldName: string, rowsPerPage: number): void {
    this.tableRowsPerPage.update(state => ({
      ...state,
      [fieldName]: rowsPerPage
    }));

    // Reset to first page
    this.tableCurrentPage.update(state => ({
      ...state,
      [fieldName]: 1
    }));
  }

  /**
   * Toggle row selection
   */
  protected toggleTableRowSelection(fieldName: string, rowId: string | number): void {
    this.tableSelection.update(state => {
      const currentSelection = new Set(state[fieldName] || []);

      if (currentSelection.has(rowId)) {
        currentSelection.delete(rowId);
      } else {
        currentSelection.add(rowId);
      }

      return {
        ...state,
        [fieldName]: currentSelection
      };
    });

    // Update form value with selected row IDs
    const selectedIds = Array.from(this.tableSelection()[fieldName] || []);
    this.formValues.update(values => ({
      ...values,
      [fieldName]: selectedIds
    }));
  }

  /**
   * Toggle select all rows
   */
  protected toggleTableSelectAll(fieldName: string, field: Field): void {
    const currentSelection = this.tableSelection()[fieldName] || new Set();
    const visibleRows = this.getTableRows(field);

    // If all visible rows are selected, deselect all; otherwise select all
    const allSelected = visibleRows.every(row => currentSelection.has(row.id!));

    this.tableSelection.update(state => {
      const newSelection = new Set(state[fieldName] || []);

      if (allSelected) {
        // Deselect all visible rows
        visibleRows.forEach(row => newSelection.delete(row.id!));
      } else {
        // Select all visible rows
        visibleRows.forEach(row => {
          if (row.id !== undefined) {
            newSelection.add(row.id);
          }
        });
      }

      return {
        ...state,
        [fieldName]: newSelection
      };
    });

    // Update form value
    const selectedIds = Array.from(this.tableSelection()[fieldName] || []);
    this.formValues.update(values => ({
      ...values,
      [fieldName]: selectedIds
    }));
  }

  /**
   * Check if row is selected
   */
  protected isTableRowSelected(fieldName: string, rowId: string | number): boolean {
    return this.tableSelection()[fieldName]?.has(rowId) || false;
  }

  /**
   * Check if all visible rows are selected
   */
  protected isTableAllSelected(fieldName: string, field: Field): boolean {
    const currentSelection = this.tableSelection()[fieldName];
    if (!currentSelection || currentSelection.size === 0) return false;

    const visibleRows = this.getTableRows(field);
    return visibleRows.length > 0 && visibleRows.every(row => currentSelection.has(row.id!));
  }

  /**
   * Check if some (but not all) visible rows are selected
   */
  protected isTableIndeterminate(fieldName: string, field: Field): boolean {
    const currentSelection = this.tableSelection()[fieldName];
    if (!currentSelection || currentSelection.size === 0) return false;

    const visibleRows = this.getTableRows(field);
    const selectedCount = visibleRows.filter(row => currentSelection.has(row.id!)).length;

    return selectedCount > 0 && selectedCount < visibleRows.length;
  }

  /**
   * Format cell value based on column type
   */
  protected formatTableCell(value: any, column: DataTableColumn): string {
    if (value === null || value === undefined) return '';

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));

      case 'number':
        if (column.format) {
          return new Intl.NumberFormat('en-US').format(Number(value));
        }
        return String(value);

      case 'date':
        if (column.format) {
          // Simple date formatting
          const date = new Date(value);
          return date.toLocaleDateString('en-US');
        }
        return String(value);

      default:
        return String(value);
    }
  }

  /**
   * Get badge color class for status badges
   */
  protected getBadgeColor(value: string, column: DataTableColumn): string {
    if (!column.badgeColorMap) return 'secondary';
    return column.badgeColorMap[value] || 'secondary';
  }

  /**
   * Generate link URL from template
   */
  protected generateTableLink(row: DataTableRow, template: string): string {
    let url = template;
    // Replace {{key}} placeholders with row values
    Object.keys(row).forEach(key => {
      url = url.replace(new RegExp(`{{${key}}}`, 'g'), String(row[key]));
    });
    return url;
  }

  /**
   * Get avatar initials from name
   */
  protected getAvatarInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get pagination info text (e.g., "1-10 of 100")
   */
  protected getTablePaginationInfo(field: Field): string {
    const fieldName = field.name;
    const currentPage = this.tableCurrentPage()[fieldName] || 1;
    const rowsPerPage = this.tableRowsPerPage()[fieldName] || 10;
    const totalRows = this.getTableTotalRows(field);

    if (totalRows === 0) return '0-0 of 0';

    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRows);

    return `${startRow}-${endRow} of ${totalRows}`;
  }

  /**
   * Get page numbers for pagination
   */
  protected getTablePageNumbers(field: Field): number[] {
    const totalPages = this.getTableTotalPages(field);
    const currentPage = this.tableCurrentPage()[field.name] || 1;

    // Show max 5 page numbers
    const maxPages = 5;
    const pages: number[] = [];

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Handle table action click
   */
  protected handleTableAction(action: string, row: DataTableRow): void {
    console.log('Table action:', action, 'Row:', row);
    // This can be extended to emit events or call custom handlers
  }

  /**
   * Check if an action button should be visible based on visibleWhen condition
   */
  protected isActionVisible(action: any, row: DataTableRow): boolean {
    if (!action.visibleWhen) return true;

    try {
      // Create a function that evaluates the condition with row context
      // The visibleWhen string is a JavaScript expression that can reference row properties
      // Example: "row.status === 'Active'" or "row.role === 'Admin'"
      const evalFunc = new Function('row', `return ${action.visibleWhen};`);
      return evalFunc(row);
    } catch (error) {
      console.error('Error evaluating action visibility condition:', error, action.visibleWhen);
      return true; // Show by default if condition fails
    }
  }

  /**
   * Track dropdown menu state for action menus
   */
  protected readonly openActionMenus = signal<Record<string, boolean>>({});

  /**
   * Toggle action dropdown menu
   */
  protected toggleActionMenu(tableFieldName: string, rowId: string | number): void {
    const menuKey = `${tableFieldName}_${rowId}`;
    this.openActionMenus.update(state => ({
      ...state,
      [menuKey]: !state[menuKey]
    }));
  }

  /**
   * Check if action menu is open
   */
  protected isActionMenuOpen(tableFieldName: string, rowId: string | number): boolean {
    const menuKey = `${tableFieldName}_${rowId}`;
    return this.openActionMenus()[menuKey] || false;
  }

  /**
   * Close action menu
   */
  protected closeActionMenu(tableFieldName: string, rowId: string | number): void {
    const menuKey = `${tableFieldName}_${rowId}`;
    this.openActionMenus.update(state => ({
      ...state,
      [menuKey]: false
    }));
  }

  /**
   * Get visible actions for a row (excluding menu items, counting only top-level actions)
   */
  protected getVisibleActions(actions: DataTableAction[], row: DataTableRow): DataTableAction[] {
    return actions.filter(action => this.isActionVisible(action, row));
  }

  /**
   * Count visible actions for a row (excluding menu items, counting only top-level actions)
   */
  protected getVisibleActionsCount(actions: DataTableAction[], row: DataTableRow): number {
    return this.getVisibleActions(actions, row).length;
  }

  // ==================== Timeline Methods ====================

  /**
   * Initialize timeline field
   */
  protected initializeTimeline(field: Field): void {
    if (!field.timelineConfig) return;

    const fieldName = field.name;
    const config = field.timelineConfig;

    // Initialize data
    if (config.items) {
      this.timelineData.update(data => ({
        ...data,
        [fieldName]: config.items || []
      }));

      // Process grouping if enabled
      if (config.grouping?.enabled) {
        this.groupTimelineItems(fieldName, config.items || [], config);
      }
    } else if (config.dataEndpoint) {
      // Fetch data from API
      this.fetchTimelineData(fieldName, config.dataEndpoint);
    }

    // Initialize expanded state
    this.timelineExpanded.update(state => ({
      ...state,
      [fieldName]: new Set()
    }));
  }

  /**
   * Fetch timeline data from API
   */
  private fetchTimelineData(fieldName: string, endpoint: string): void {
    this.timelineLoading.update(state => ({ ...state, [fieldName]: true }));

    this._http.get<any[]>(endpoint).subscribe({
      next: (data) => {
        this.timelineData.update(state => ({
          ...state,
          [fieldName]: data
        }));

        // Process grouping if enabled
        const field = this.fields().find(f => f.name === fieldName);
        if (field?.timelineConfig?.grouping?.enabled) {
          this.groupTimelineItems(fieldName, data, field.timelineConfig);
        }

        this.timelineLoading.update(state => ({ ...state, [fieldName]: false }));
      },
      error: (error) => {
        console.error('Error fetching timeline data:', error);
        this.timelineLoading.update(state => ({ ...state, [fieldName]: false }));
      }
    });
  }

  /**
   * Get processed timeline items (sorted, filtered)
   */
  protected getTimelineItems(field: Field): any[] {
    const fieldName = field.name;
    const config = field.timelineConfig;
    if (!config) return [];

    let items = this.timelineData()[fieldName] || [];

    // Apply sorting by timestamp
    if (config.sortOrder && items.length > 0) {
      items = [...items].sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;

        return config.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    // Apply max items limit
    if (config.maxItems && items.length > config.maxItems) {
      items = items.slice(0, config.maxItems);
    }

    // Add position for alternating layout
    if (config.style?.alignment === 'alternating') {
      items = items.map((item, index) => ({
        ...item,
        position: item.position || (index % 2 === 0 ? 'left' : 'right')
      }));
    }

    return items;
  }

  /**
   * Group timeline items by year, month, or custom field
   */
  protected groupTimelineItems(fieldName: string, items: any[], config: any): void {
    const grouping = config.grouping;
    if (!grouping?.enabled) return;

    const grouped = new Map<string, any[]>();

    items.forEach(item => {
      let groupKey = '';

      if (grouping.groupBy === 'year' && item.timestamp) {
        const date = new Date(item.timestamp);
        groupKey = date.getFullYear().toString();
      } else if (grouping.groupBy === 'month' && item.timestamp) {
        const date = new Date(item.timestamp);
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (grouping.groupBy === 'custom' && grouping.customGroupField) {
        groupKey = item[grouping.customGroupField] || 'Other';
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(item);
    });

    this.timelineGroupedData.update(state => ({
      ...state,
      [fieldName]: grouped
    }));
  }

  /**
   * Get grouped timeline data
   */
  protected getGroupedTimelineItems(fieldName: string): Map<string, any[]> {
    return this.timelineGroupedData()[fieldName] || new Map();
  }

  /**
   * Format group label for display
   */
  protected formatGroupLabel(groupKey: string, config: any): string {
    const grouping = config.grouping;

    if (grouping?.groupBy === 'year') {
      return groupKey;
    } else if (grouping?.groupBy === 'month') {
      const [year, month] = groupKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      return grouping.groupLabelFormat?.includes('YYYY')
        ? `${monthName} ${year}`
        : monthName;
    }

    return groupKey;
  }

  /**
   * Toggle timeline item expansion
   */
  protected toggleTimelineItem(fieldName: string, itemId: string | number): void {
    this.timelineExpanded.update(state => {
      const currentExpanded = new Set(state[fieldName] || []);

      if (currentExpanded.has(itemId)) {
        currentExpanded.delete(itemId);
      } else {
        currentExpanded.add(itemId);
      }

      return {
        ...state,
        [fieldName]: currentExpanded
      };
    });
  }

  /**
   * Check if timeline item is expanded
   */
  protected isTimelineItemExpanded(fieldName: string, itemId: string | number): boolean {
    return this.timelineExpanded()[fieldName]?.has(itemId) || false;
  }

  /**
   * Format timeline timestamp
   */
  protected formatTimelineDate(timestamp: string | Date | undefined, format?: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const defaultFormat = format || 'MMM DD, YYYY';

    // Simple date formatting based on format string
    if (defaultFormat === 'MMM DD, YYYY') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (defaultFormat === 'YYYY') {
      return date.getFullYear().toString();
    } else if (defaultFormat === 'h:mm A') {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (defaultFormat === 'MMM DD, YYYY h:mm A') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Fallback to default
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get timeline item marker class based on status
   */
  protected getTimelineMarkerClass(item: any): string {
    const status = item.status || 'pending';
    return `timeline-marker-${status}`;
  }

  /**
   * Get timeline badge color class
   */
  protected getTimelineBadgeClass(badge: any): string {
    const color = badge.color || 'secondary';
    const outlined = badge.outlined ? 'outlined-' : '';
    return `badge-${outlined}${color}`;
  }

  /**
   * Handle timeline item click
   */
  protected handleTimelineItemClick(field: Field, item: any): void {
    const config = field.timelineConfig;

    // If expandable, toggle expansion
    if (config?.interaction?.expandable) {
      this.toggleTimelineItem(field.name, item.id);
    }

    // Call custom click handler if provided
    if (config?.interaction?.onItemClick) {
      console.log('Timeline item clicked:', config.interaction.onItemClick, 'Item:', item);
      // This can be extended to emit events or call custom handlers
    }
  }

  /**
   * Get timeline connector line class
   */
  protected getTimelineConnectorClass(config: any): string {
    const lineStyle = config.style?.lineStyle || 'solid';
    return `timeline-connector-${lineStyle}`;
  }

  /**
   * Check if timeline should show connector
   */
  protected shouldShowTimelineConnector(config: any): boolean {
    return config.showConnector !== false && config.style?.lineStyle !== 'none';
  }

  /**
   * Get timeline layout classes
   */
  protected getTimelineLayoutClass(config: any): string {
    const layout = config.style?.layout || 'vertical';
    const alignment = config.style?.alignment || 'left';
    const cardStyle = config.style?.cardStyle ? 'card-style' : '';
    const dense = config.style?.dense ? 'dense' : '';

    return `timeline-${layout} timeline-${alignment} ${cardStyle} ${dense}`.trim();
  }
}
