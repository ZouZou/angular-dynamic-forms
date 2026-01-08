import { Component, computed, effect, inject, signal, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { Field, FieldOption, VisibilityCondition, SimpleVisibilityCondition, ComplexVisibilityCondition, VisibilityOperator, ArrayFieldConfig, AsyncValidator, ComputedFieldConfig, FormSubmission, FormSchema, FormSection, ValueTransform, DataTableColumn, DataTableRow, DataTableConfig, DataTableAction, DataTableActionMenuItem } from './models/field.model';
import { DynamicFormsService } from './dq-dynamic-form.service';
import { MaskService } from './mask.service';
import { I18nService } from './i18n.service';
import { FormStateService } from './services/form-state.service';
import { ValidationService } from './services/validation.service';
import { SubmissionService } from './services/submission.service';
import { TextFieldComponent } from './components/field-renderers/text-field.component';
import { TextareaFieldComponent } from './components/field-renderers/textarea-field.component';
import { NumberFieldComponent } from './components/field-renderers/number-field.component';
import { DateFieldComponent } from './components/field-renderers/date-field.component';
import { CheckboxFieldComponent } from './components/field-renderers/checkbox-field.component';
import { RangeFieldComponent } from './components/field-renderers/range-field.component';
import { ColorFieldComponent } from './components/field-renderers/color-field.component';
import { RadioFieldComponent } from './components/field-renderers/radio-field.component';
import { SelectFieldComponent } from './components/field-renderers/select-field.component';
import { MultiselectFieldComponent } from './components/field-renderers/multiselect-field.component';
import { DateTimeFieldComponent } from './components/field-renderers/datetime-field.component';
import { FileFieldComponent } from './components/field-renderers/file-field.component';
import { RichtextFieldComponent } from './components/field-renderers/richtext-field.component';
import { ArrayFieldComponent } from './components/field-renderers/array-field.component';

@Component({
  selector: 'dq-dynamic-form',
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    TextFieldComponent,
    TextareaFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    RangeFieldComponent,
    ColorFieldComponent,
    RadioFieldComponent,
    SelectFieldComponent,
    MultiselectFieldComponent,
    DateTimeFieldComponent,
    FileFieldComponent,
    RichtextFieldComponent,
    ArrayFieldComponent
  ],
  templateUrl: './dq-dynamic-form.html',
  styleUrl: './dq-dynamic-form.scss',
  providers: [DynamicFormsService, FormStateService, ValidationService, SubmissionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // Inject services
  private readonly _formService = inject(DynamicFormsService);
  private readonly _maskService = inject(MaskService);
  private readonly _http = inject(HttpClient);
  protected readonly _i18nService = inject(I18nService);
  private readonly _formState = inject(FormStateService);
  private readonly _validation = inject(ValidationService);
  private readonly _submission = inject(SubmissionService);

  // Component-specific state (not in services)
  protected readonly fields = signal<Field[]>([]);
  protected readonly title = signal<string>('');

  // Expose service signals for template access
  protected readonly formValues = this._formState.formValues;
  protected readonly touched = this._formState.touched;
  protected readonly loading = this._formState.loading;
  protected readonly dynamicOptions = this._formState.dynamicOptions;
  protected readonly fieldLoading = this._formState.fieldLoading;
  protected readonly fieldErrors = this._formState.fieldErrors;
  protected readonly dirty = this._formState.dirty;
  protected readonly fileData = this._formState.fileData;
  protected readonly arrayItemCounts = this._formState.arrayItemCounts;
  protected readonly pristine = this._formState.pristine;

  // Expose validation service signals
  protected readonly asyncValidationState = this._validation.asyncValidationState;
  protected readonly asyncErrors = this._validation.asyncErrors;

  // Expose submission service signals
  protected readonly submitted = this._submission.submitted;
  protected readonly submittedData = this._submission.submittedData;
  protected readonly submitting = this._submission.submitting;
  protected readonly submitSuccess = this._submission.submitSuccess;
  protected readonly submitError = this._submission.submitError;
  protected readonly submitRetryCount = this._submission.submitRetryCount;
  protected readonly autosaveEnabled = this._submission.autosaveEnabled;
  protected readonly lastSaved = this._submission.lastSaved;

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
              this._formState.updateFormValue(field.name, '');
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
          if (this._formState.isProgrammaticUpdate(field.name)) {
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
            this._formState.updateFormValue(field.name, newValue);
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
            this._formState.updateFormValue(field.name, newValue);
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

      // Check for autosave configuration
      if (schema.autosave?.enabled) {
        const autosaveKey = schema.autosave.key || `formDraft_${schema.title.replace(/\s+/g, '_')}`;

        // Enable autosave via SubmissionService
        this._submission.enableAutosave(
          schema.autosave,
          autosaveKey,
          () => this.saveDraft()
        );
      }

      // Store submission configuration (will be used by SubmissionService later)
      if (schema.submission) {
        // Store in private property for submit() method to access
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

      // Initialize form state via FormStateService
      this._formState.initializeForm(initialValues, initialTouched, initialDirty, initialArrayCounts);
  }

  private submissionConfig: FormSubmission | null = null;

  ngOnDestroy(): void {
    // Cleanup services
    this._submission.destroy();
    this._validation.clearAllTimers();
  }

  updateFormValue(fieldName: string, value: unknown): void {
    // Use FormStateService to update form value
    this._formState.updateFormValue(fieldName, value);
    this._formState.markTouched(fieldName);

    // Trigger async validation if configured
    const field = this.fields().find(f => f.name === fieldName ||
      fieldName.startsWith(f.name + '['));
    if (field?.validations?.asyncValidator && value) {
      this._validation.validateAsync(field, value);
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

    // Use FormStateService to update form value
    this._formState.updateFormValue(fieldName, maskedValue);
    this._formState.markTouched(fieldName);

    // For validation, use raw (unmasked) value
    const rawForValidation = this._maskService.getRawValue(maskedValue, field.mask);
    if (field.validations?.asyncValidator && rawForValidation) {
      this._validation.validateAsync(field, rawForValidation);
    }
  }

  /**
   * Handle value change from field renderer components
   */
  protected onFieldValueChange(event: { fieldName: string; value: unknown; isMasked?: boolean }): void {
    const field = this.fields().find(f => f.name === event.fieldName);
    if (!field) return;

    if (event.isMasked && field.mask) {
      this.updateMaskedFormValue(event.fieldName, event.value as string, field);
    } else {
      this.updateFormValue(event.fieldName, event.value);
    }
  }

  /**
   * Handle blur from field renderer components
   */
  protected onFieldBlur(fieldName: string): void {
    this._formState.markTouched(fieldName);
  }

  /**
   * Handle file upload from file field component
   */
  protected onFileChange(event: { fieldName: string; files: FileList | null }): void {
    const field = this.fields().find(f => f.name === event.fieldName);
    if (!field) return;
    this.handleFileUpload(event.fieldName, event.files, field);
  }

  /**
   * Handle array item addition from array field component
   */
  protected onArrayAddItem(fieldName: string): void {
    const field = this.fields().find(f => f.name === fieldName);
    if (!field) return;
    this.addArrayItem(field);
  }

  /**
   * Handle array item removal from array field component
   */
  protected onArrayRemoveItem(event: { fieldName: string; index: number }): void {
    const field = this.fields().find(f => f.name === event.fieldName);
    if (!field) return;
    this.removeArrayItem(field, event.index);
  }

  /**
   * Handle array sub-field value change from array field component
   */
  protected onArraySubFieldChange(event: { fieldName: string; value: unknown }): void {
    this.updateFormValue(event.fieldName, event.value);
  }

  /**
   * Handle array sub-field blur from array field component
   */
  protected onArraySubFieldBlur(fieldName: string): void {
    this._formState.markTouched(fieldName);
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
  getMaxLength(field: Field): number | null {
    if (!field.mask) return null;
    return this._maskService.getMaxLength(field.mask) ?? null;
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
  // Async validation methods moved to ValidationService

  /**
   * Update checkbox value programmatically (used for dependencies)
   * Prevents infinite loops by marking the field as being updated programmatically
   */
  private updateCheckboxProgrammatically(
    fieldName: string,
    value: boolean
  ): void {
    // Mark this field as being updated programmatically
    this._formState.setProgrammaticUpdate(fieldName, true);

    // Update the value using FormStateService
    this._formState.updateFormValue(fieldName, value);

    // Clear the programmatic update flag after a brief delay
    // This allows the effect to complete before allowing user updates again
    setTimeout(() => {
      this._formState.setProgrammaticUpdate(fieldName, false);
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
    return this._formState.getArrayItemCount(fieldName);
  }

  /**
   * Get array of indices for an array field
   */
  getArrayIndices(fieldName: string): number[] {
    const count = this._formState.getArrayItemCount(fieldName);
    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Add a new item to an array field
   */
  addArrayItem(field: Field): void {
    if (!field.arrayConfig) return;

    const currentCount = this._formState.getArrayItemCount(field.name);
    const maxItems = field.arrayConfig.maxItems;

    // Check if we can add more items
    if (maxItems && currentCount >= maxItems) {
      return;
    }

    // Increment count
    this._formState.incrementArrayCount(field.name);

    // Initialize values for new array item's fields
    const newIndex = currentCount;
    field.arrayConfig.fields.forEach(subField => {
      const arrayFieldName = `${field.name}[${newIndex}].${subField.name}`;
      const initialValue = this.getInitialValueForField(subField);

      // Add field with initial value
      this._formState.addField(arrayFieldName, initialValue);
    });
  }

  /**
   * Remove an item from an array field
   */
  removeArrayItem(field: Field, index: number): void {
    if (!field.arrayConfig) return;

    const currentCount = this._formState.getArrayItemCount(field.name);
    const minItems = field.arrayConfig.minItems || 0;

    // Check if we can remove items
    if (currentCount <= minItems) {
      return;
    }

    // Remove values for this array item
    field.arrayConfig.fields.forEach(subField => {
      const arrayFieldName = `${field.name}[${index}].${subField.name}`;
      this._formState.removeField(arrayFieldName);
    });

    // Shift all subsequent items down
    for (let i = index + 1; i < currentCount; i++) {
      field.arrayConfig.fields.forEach(subField => {
        const oldKey = `${field.name}[${i}].${subField.name}`;
        const newKey = `${field.name}[${i - 1}].${subField.name}`;
        this._formState.renameField(oldKey, newKey);
      });
    }

    // Decrement count
    this._formState.decrementArrayCount(field.name);
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

  async saveUserData(): Promise<void> {
    // Check if form is valid
    if (!this.isValid()) {
      // Focus on first field with error for better accessibility
      this.focusFirstError();
      return;
    }

    // Submit using SubmissionService
    if (!this.submissionConfig) {
      // No submission config - create default
      this.submissionConfig = { endpoint: undefined };
    }

    await this._submission.submit(
      this.formValues(),
      this.submissionConfig,
      this.submissionEndpoint()
    );

    // Clear draft on successful submission
    if (this.submitSuccess() && this.autosaveEnabled()) {
      this._submission.clearAutosavedData();
    }
  }

  /**
   * Retry form submission (called from template)
   */
  async retrySubmit(): Promise<void> {
    await this.saveUserData();
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
    this._submission.saveToStorage(this.formValues());
  }

  /**
   * Load draft from storage (returns null - handled by SubmissionService)
   */
  private loadDraft(): { values: Record<string, unknown>; timestamp: string } | null {
    // This method is kept for compatibility but the actual restoration
    // happens in SubmissionService.restoreAutosavedData() during enableAutosave()
    return null;
  }

  /**
   * Clear draft from storage
   */
  private clearDraft(): void {
    this._submission.clearAutosavedData();
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

      // Mark fields as touched using service
      Object.keys(touchedUpdate).forEach(fieldName => {
        this._formState.markTouched(fieldName);
      });

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
   * Check if submit button should be shown
   */
  shouldShowSubmitButton(): boolean {
    // Default to true if not explicitly set to false
    return this.submissionConfig?.showSubmitButton !== false;
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
    this._formState.updateFormValue(fieldName, selectedIds);
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
    this._formState.updateFormValue(fieldName, selectedIds);
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
