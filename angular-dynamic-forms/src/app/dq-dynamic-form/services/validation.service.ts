import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Field, AsyncValidator } from '../models/field.model';

/**
 * Service for handling form validation including async validation
 */
@Injectable()
export class ValidationService {
  private readonly http = inject(HttpClient);

  // Async validation state
  readonly asyncValidationState = signal<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  readonly asyncErrors = signal<Record<string, string>>({});

  // Debounce timers for async validation
  private asyncValidationTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  /**
   * Validate a field value asynchronously
   */
  async validateAsync(field: Field, value: unknown): Promise<void> {
    if (!field.validations?.asyncValidator) {
      return;
    }

    const validator = field.validations.asyncValidator;
    const debounceMs = validator.debounceMs || 300;

    // Clear existing timer
    if (this.asyncValidationTimers[field.name]) {
      clearTimeout(this.asyncValidationTimers[field.name]);
    }

    // Set validating state immediately
    this.setAsyncValidationState(field.name, 'validating');

    // Debounce the actual validation
    return new Promise((resolve) => {
      this.asyncValidationTimers[field.name] = setTimeout(async () => {
        try {
          const result = await this.performAsyncValidation(validator, value);

          if (result.valid) {
            this.setAsyncValidationState(field.name, 'valid');
            this.clearAsyncError(field.name);
          } else {
            this.setAsyncValidationState(field.name, 'invalid');
            this.setAsyncError(field.name, result.message || validator.errorMessage || 'Validation failed');
          }
          resolve();
        } catch (error) {
          this.setAsyncValidationState(field.name, 'invalid');
          this.setAsyncError(field.name, 'Validation request failed');
          resolve();
        }
      }, debounceMs);
    });
  }

  /**
   * Perform the actual async validation HTTP request
   */
  private async performAsyncValidation(
    validator: AsyncValidator,
    value: unknown
  ): Promise<{ valid: boolean; message?: string }> {
    const method = validator.method || 'POST';
    const endpoint = validator.endpoint;

    if (method === 'GET') {
      const response = await lastValueFrom(this.http.get<any>(endpoint, {
        params: { value: String(value) }
      }));
      return this.interpretValidationResponse(response, validator.validWhen);
    } else {
      const response = await lastValueFrom(this.http.post<any>(endpoint, { value }));
      return this.interpretValidationResponse(response, validator.validWhen);
    }
  }

  /**
   * Interpret the validation response based on validWhen configuration
   */
  private interpretValidationResponse(
    response: any,
    validWhen: 'exists' | 'notExists' | 'custom' = 'custom'
  ): { valid: boolean; message?: string } {
    if (validWhen === 'exists') {
      return { valid: !!response };
    } else if (validWhen === 'notExists') {
      return { valid: !response };
    } else {
      // Custom validation - expect { valid: boolean, message?: string }
      return {
        valid: response?.valid === true,
        message: response?.message
      };
    }
  }

  /**
   * Set async validation state for a field
   */
  private setAsyncValidationState(
    fieldName: string,
    state: 'idle' | 'validating' | 'valid' | 'invalid'
  ): void {
    this.asyncValidationState.update(current => ({
      ...current,
      [fieldName]: state
    }));
  }

  /**
   * Set async validation error
   */
  private setAsyncError(fieldName: string, error: string): void {
    this.asyncErrors.update(current => ({
      ...current,
      [fieldName]: error
    }));
  }

  /**
   * Clear async validation error
   */
  private clearAsyncError(fieldName: string): void {
    this.asyncErrors.update(current => {
      const { [fieldName]: _, ...rest } = current;
      return rest;
    });
  }

  /**
   * Get async validation state for a field
   */
  getAsyncValidationState(fieldName: string): 'idle' | 'validating' | 'valid' | 'invalid' {
    return this.asyncValidationState()[fieldName] || 'idle';
  }

  /**
   * Get async validation error for a field
   */
  getAsyncError(fieldName: string): string | undefined {
    return this.asyncErrors()[fieldName];
  }

  /**
   * Clear all async validation timers
   */
  clearAllTimers(): void {
    Object.values(this.asyncValidationTimers).forEach(timer => clearTimeout(timer));
    this.asyncValidationTimers = {};
  }

  /**
   * Reset async validation state
   */
  reset(): void {
    this.clearAllTimers();
    this.asyncValidationState.set({});
    this.asyncErrors.set({});
  }
}
