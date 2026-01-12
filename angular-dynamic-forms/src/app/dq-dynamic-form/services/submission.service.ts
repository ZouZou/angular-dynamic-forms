import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormSubmission } from '../models/field.model';

/**
 * Service for handling form submission and autosave functionality
 */
@Injectable()
export class SubmissionService {
  private readonly http = inject(HttpClient);

  // Submission state
  readonly submitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitRetryCount = signal(0);
  readonly submitted = signal(false);
  readonly submittedData = signal<Record<string, unknown> | null>(null);

  // Autosave state
  readonly autosaveEnabled = signal(false);
  readonly lastSaved = signal<Date | null>(null);

  private autosaveTimer: ReturnType<typeof setInterval> | null = null;
  private autosaveKey = '';
  private autosaveConfig: any = null;
  private submissionConfig: FormSubmission | null = null;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Submit the form
   */
  async submit(
    formData: Record<string, unknown>,
    config: FormSubmission,
    endpointOverride?: string | null
  ): Promise<void> {
    this.submissionConfig = config;
    const endpoint = endpointOverride || config.endpoint;

    if (!endpoint) {
      // No endpoint - just display the data
      this.submitted.set(true);
      this.submittedData.set(formData);
      this.submitSuccess.set(true);
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      await this.submitWithRetry(endpoint, formData, config);
      this.submitSuccess.set(true);
      this.submitted.set(true);
      this.submittedData.set(formData);

      // Redirect if configured
      if (config.redirectOnSuccess) {
        setTimeout(() => {
          window.location.href = config.redirectOnSuccess!;
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof HttpErrorResponse
        ? error.error?.message || error.message
        : 'An unknown error occurred';
      this.submitError.set(config.errorMessage || errorMessage);
      this.submitSuccess.set(false);
    } finally {
      this.submitting.set(false);
      this.submitRetryCount.set(0);
    }
  }

  /**
   * Submit with retry logic
   */
  private async submitWithRetry(
    endpoint: string,
    formData: Record<string, unknown>,
    config: FormSubmission,
    attempt: number = 0
  ): Promise<any> {
    try {
      const method = config.method || 'POST';
      const headers = config.headers || {};

      if (method === 'POST') {
        return await lastValueFrom(this.http.post(endpoint, formData, { headers }));
      } else if (method === 'PUT') {
        return await lastValueFrom(this.http.put(endpoint, formData, { headers }));
      } else if (method === 'PATCH') {
        return await lastValueFrom(this.http.patch(endpoint, formData, { headers }));
      }
    } catch (error) {
      // Retry logic for network errors
      if (attempt < this.MAX_RETRY_ATTEMPTS && this.isRetryableError(error)) {
        this.submitRetryCount.set(attempt + 1);
        await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        return this.submitWithRetry(endpoint, formData, config, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable (network errors, 5xx errors)
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 500 || error.status === 0;
    }
    return false;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configure and enable autosave
   */
  enableAutosave(
    config: any,
    key: string,
    saveCallback: () => void
  ): void {
    this.autosaveConfig = config;
    this.autosaveKey = key;
    this.autosaveEnabled.set(true);

    // Start autosave timer
    const intervalMs = (config.intervalSeconds || 30) * 1000;
    this.autosaveTimer = setInterval(() => {
      saveCallback();
      this.lastSaved.set(new Date());
    }, intervalMs);

    // Try to restore previous autosaved data
    this.restoreAutosavedData();
  }

  /**
   * Disable autosave
   */
  disableAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    this.autosaveEnabled.set(false);
  }

  /**
   * Save data to storage (localStorage or sessionStorage)
   */
  saveToStorage(formData: Record<string, unknown>): void {
    if (!this.autosaveConfig || !this.autosaveKey) return;

    try {
      const storage = this.autosaveConfig.storage === 'sessionStorage'
        ? sessionStorage
        : localStorage;

      const expirationMs = (this.autosaveConfig.expirationDays || 7) * 24 * 60 * 60 * 1000;
      const expiresAt = Date.now() + expirationMs;

      const saveData = {
        formData,
        expiresAt
      };

      storage.setItem(this.autosaveKey, JSON.stringify(saveData));
      this.lastSaved.set(new Date());
    } catch (error) {
      // Handle quota exceeded or privacy mode errors
      console.error('Failed to save form data to storage:', error);
      // Storage failed, but don't break the application
      // User can still submit the form manually
    }
  }

  /**
   * Restore autosaved data from storage
   */
  private restoreAutosavedData(): Record<string, unknown> | null {
    if (!this.autosaveConfig || !this.autosaveKey) return null;

    try {
      const storage = this.autosaveConfig.storage === 'sessionStorage'
        ? sessionStorage
        : localStorage;

      const saved = storage.getItem(this.autosaveKey);
      if (!saved) return null;

      const { formData, expiresAt } = JSON.parse(saved);

      // Check if data has expired
      if (Date.now() > expiresAt) {
        storage.removeItem(this.autosaveKey);
        return null;
      }

      return formData;
    } catch (error) {
      // Handle JSON parse errors or storage access errors
      console.error('Failed to restore autosaved data:', error);
      return null;
    }
  }

  /**
   * Clear autosaved data
   */
  clearAutosavedData(): void {
    if (!this.autosaveConfig || !this.autosaveKey) return;

    try {
      const storage = this.autosaveConfig.storage === 'sessionStorage'
        ? sessionStorage
        : localStorage;

      storage.removeItem(this.autosaveKey);
    } catch (error) {
      // Handle storage access errors (e.g., privacy mode)
      console.error('Failed to clear autosaved data:', error);
    }
  }

  /**
   * Reset submission state
   */
  reset(): void {
    this.submitting.set(false);
    this.submitSuccess.set(false);
    this.submitError.set(null);
    this.submitRetryCount.set(0);
    this.submitted.set(false);
    this.submittedData.set(null);
    this.disableAutosave();
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.disableAutosave();
  }
}
