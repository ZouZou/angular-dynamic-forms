import { Injectable, signal, computed } from '@angular/core';
import { Field, FieldOption } from '../models/field.model';

/**
 * Centralized service for managing dynamic form state
 * Handles form values, touched state, dirty state, and field-specific state
 */
@Injectable()
export class FormStateService {
  // Core form state
  readonly fields = signal<Field[]>([]);
  readonly title = signal<string>('');
  readonly formValues = signal<Record<string, unknown>>({});
  readonly touched = signal<Record<string, boolean>>({});
  readonly dirty = signal<Record<string, boolean>>({});
  readonly loading = signal(true);

  // Field-specific state
  readonly dynamicOptions = signal<Record<string, FieldOption[]>>({});
  readonly fieldLoading = signal<Record<string, boolean>>({});
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly fileData = signal<Record<string, any>>({});

  // Internal state
  private readonly initialValues = signal<Record<string, unknown>>({});
  private readonly isUpdatingProgrammatically = signal<Set<string>>(new Set());

  // Array field state
  readonly arrayItemCounts = signal<Record<string, number>>({});

  // Computed: Check if entire form is pristine (no changes)
  readonly pristine = computed<boolean>(() =>
    !Object.values(this.dirty()).some(isDirty => isDirty)
  );

  /**
   * Update a form field value
   */
  updateFormValue(fieldName: string, value: unknown): void {
    // Update form values
    this.formValues.update(current => ({
      ...current,
      [fieldName]: value
    }));

    // Mark field as dirty if value differs from initial
    const initial = this.initialValues()[fieldName];
    this.dirty.update(current => ({
      ...current,
      [fieldName]: value !== initial
    }));
  }

  /**
   * Mark a field as touched
   */
  markTouched(fieldName: string): void {
    this.touched.update(current => ({
      ...current,
      [fieldName]: true
    }));
  }

  /**
   * Set initial form values (for dirty tracking)
   */
  setInitialValues(values: Record<string, unknown>): void {
    this.initialValues.set(values);
    this.formValues.set({ ...values });
  }

  /**
   * Reset form to initial state
   */
  reset(): void {
    const initial = this.initialValues();
    this.formValues.set({ ...initial });
    this.touched.set({});
    this.dirty.set({});
    this.fieldErrors.set({});
  }

  /**
   * Get current form value for a field
   */
  getFieldValue(fieldName: string): unknown {
    return this.formValues()[fieldName];
  }

  /**
   * Check if field has been touched
   */
  isFieldTouched(fieldName: string): boolean {
    return this.touched()[fieldName] || false;
  }

  /**
   * Check if field is dirty
   */
  isFieldDirty(fieldName: string): boolean {
    return this.dirty()[fieldName] || false;
  }

  /**
   * Set programmatic update flag (prevents infinite loops)
   */
  setProgrammaticUpdate(fieldName: string, updating: boolean): void {
    this.isUpdatingProgrammatically.update(current => {
      const newSet = new Set(current);
      if (updating) {
        newSet.add(fieldName);
      } else {
        newSet.delete(fieldName);
      }
      return newSet;
    });
  }

  /**
   * Check if field is being updated programmatically
   */
  isProgrammaticUpdate(fieldName: string): boolean {
    return this.isUpdatingProgrammatically().has(fieldName);
  }

  /**
   * Update dynamic options for a field
   */
  setFieldOptions(fieldName: string, options: FieldOption[]): void {
    this.dynamicOptions.update(current => ({
      ...current,
      [fieldName]: options
    }));
  }

  /**
   * Set field loading state
   */
  setFieldLoading(fieldName: string, loading: boolean): void {
    this.fieldLoading.update(current => ({
      ...current,
      [fieldName]: loading
    }));
  }

  /**
   * Set field error
   */
  setFieldError(fieldName: string, error: string | null): void {
    if (error === null) {
      this.fieldErrors.update(current => {
        const { [fieldName]: _, ...rest } = current;
        return rest;
      });
    } else {
      this.fieldErrors.update(current => ({
        ...current,
        [fieldName]: error
      }));
    }
  }

  /**
   * Set file data for a field
   */
  setFileData(fieldName: string, data: any): void {
    this.fileData.update(current => ({
      ...current,
      [fieldName]: data
    }));
  }

  /**
   * Set array item count for a field
   */
  setArrayItemCount(fieldName: string, count: number): void {
    this.arrayItemCounts.update(current => ({
      ...current,
      [fieldName]: count
    }));
  }

  /**
   * Get array item count for a field
   */
  getArrayItemCount(fieldName: string): number {
    return this.arrayItemCounts()[fieldName] || 0;
  }
}
