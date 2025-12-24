import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Field, FieldOption, FormSchema } from './models/field.model';
import { MockApiService } from './mock-api.service';

interface CacheEntry {
  data: FieldOption[];
  timestamp: number;
}

@Injectable()
export class DynamicFormsService {
  private readonly http = inject(HttpClient);
  private readonly mockApi = inject(MockApiService);

  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly optionsCache = new Map<string, CacheEntry>();

  getFormSchema(): Observable<FormSchema> {
    return this.http.get<FormSchema>(
      'forms/sample-form.json'
    );
  }

  /**
   * Fetch options from API endpoint with caching
   * Supports template variables like {{country}} in the endpoint URL
   *
   * @param endpoint - The API endpoint URL (may contain {{variable}} placeholders)
   * @param params - Key-value pairs to replace template variables
   * @returns Observable of FieldOption array
   */
  fetchOptionsFromEndpoint(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Observable<FieldOption[]> {
    // Replace template variables in endpoint
    const resolvedEndpoint = this.resolveEndpoint(endpoint, params);

    // Check cache first
    const cached = this.getCachedOptions(resolvedEndpoint);
    if (cached) {
      console.log(`[Cache HIT] ${resolvedEndpoint}`);
      return of(cached);
    }

    console.log(`[Cache MISS] Fetching: ${resolvedEndpoint}`);

    // Fetch from mock API (replace with real HTTP call in production)
    return this.mockApi.fetchOptions(resolvedEndpoint).pipe(
      tap((options) => {
        // Cache the response
        this.setCachedOptions(resolvedEndpoint, options);
      }),
      catchError((error) => {
        console.error(`[API Error] ${resolvedEndpoint}:`, error);
        // Return empty array on error (component will handle error state)
        return of([]);
      })
    );
  }

  /**
   * Replace template variables in endpoint URL
   * Example: "/api/cities?state={{state}}" with {state: "ca"} becomes "/api/cities?state=ca"
   */
  private resolveEndpoint(
    endpoint: string,
    params: Record<string, unknown>
  ): string {
    let resolved = endpoint;

    // Replace all {{variable}} placeholders
    Object.keys(params).forEach((key) => {
      const value = params[key];
      const placeholder = `{{${key}}}`;
      resolved = resolved.replace(
        new RegExp(placeholder, 'g'),
        encodeURIComponent(String(value))
      );
    });

    return resolved;
  }

  /**
   * Get cached options if not expired
   */
  private getCachedOptions(endpoint: string): FieldOption[] | null {
    const entry = this.optionsCache.get(endpoint);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > this.CACHE_TTL) {
      // Cache expired, remove it
      this.optionsCache.delete(endpoint);
      return null;
    }

    return entry.data;
  }

  /**
   * Store options in cache with current timestamp
   */
  private setCachedOptions(endpoint: string, data: FieldOption[]): void {
    this.optionsCache.set(endpoint, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached options (useful for testing or manual cache invalidation)
   */
  clearCache(): void {
    this.optionsCache.clear();
    console.log('[Cache] Cleared all cached options');
  }

  /**
   * Clear specific cached endpoint
   */
  clearCacheForEndpoint(endpoint: string): void {
    this.optionsCache.delete(endpoint);
    console.log(`[Cache] Cleared cache for: ${endpoint}`);
  }

  /**
   * Validate field asynchronously via API
   * @param endpoint - The API endpoint for validation
   * @param data - Data to send (typically { value, fieldName })
   * @param method - HTTP method (GET or POST)
   * @returns Observable of validation response
   */
  validateFieldAsync(
    endpoint: string,
    data: { value: unknown; fieldName: string },
    method: 'GET' | 'POST' = 'POST'
  ): Observable<any> {
    console.log(`[Async Validation] ${method} ${endpoint}`, data);

    // Use mock API for validation (replace with real HTTP call in production)
    return this.mockApi.validateField(endpoint, data, method).pipe(
      catchError((error) => {
        console.error(`[Async Validation Error] ${endpoint}:`, error);
        // Return invalid state on error
        return of({ valid: false, message: 'Validation request failed' });
      })
    );
  }
}
