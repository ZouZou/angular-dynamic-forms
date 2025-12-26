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
  // Track programmatic updates to prevent infinite loops in checkbox dependencies
  private readonly isUpdatingProgrammatically = signal<Set<string>>(new Set());
  // Store file data for file uploads
  protected readonly fileData = signal<Record<string, any>>({});

  // Computed: Check if entire form is pristine (no changes)
  protected readonly pristine = computed<boolean>(() =>
    !Object.values(this.dirty()).some(isDirty => isDirty)
  );

  // Expose Math for template
  protected readonly Math = Math;

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
        // Set initial values based on field type
        if (field.type === 'checkbox') {
          initialValues[field.name] = false;
        } else if (field.type === 'multiselect') {
          initialValues[field.name] = [];
        } else if (field.type === 'range') {
          initialValues[field.name] = field.min || 0;
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
}
