import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { FieldOption } from './models/field.model';

/**
 * Mock API Service
 * Simulates backend API responses for dropdown options
 */
@Injectable({
  providedIn: 'root',
})
export class MockApiService {
  // Simulated database of options
  private mockData: Record<string, FieldOption[]> = {
    // Countries (static, but demonstrating API fetch)
    countries: [
      { value: 'usa', label: 'United States' },
      { value: 'canada', label: 'Canada' },
      { value: 'mexico', label: 'Mexico' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'germany', label: 'Germany' },
      { value: 'france', label: 'France' },
      { value: 'italy', label: 'Italy' },
      { value: 'spain', label: 'Spain' },
      { value: 'japan', label: 'Japan' },
      { value: 'australia', label: 'Australia' },
    ],

    // States by country
    'states-usa': [
      { value: 'ca', label: 'California' },
      { value: 'ny', label: 'New York' },
      { value: 'tx', label: 'Texas' },
      { value: 'fl', label: 'Florida' },
      { value: 'il', label: 'Illinois' },
      { value: 'pa', label: 'Pennsylvania' },
      { value: 'oh', label: 'Ohio' },
      { value: 'ga', label: 'Georgia' },
      { value: 'nc', label: 'North Carolina' },
      { value: 'mi', label: 'Michigan' },
    ],

    'states-canada': [
      { value: 'on', label: 'Ontario' },
      { value: 'qc', label: 'Quebec' },
      { value: 'bc', label: 'British Columbia' },
      { value: 'ab', label: 'Alberta' },
      { value: 'mb', label: 'Manitoba' },
      { value: 'sk', label: 'Saskatchewan' },
      { value: 'ns', label: 'Nova Scotia' },
      { value: 'nb', label: 'New Brunswick' },
    ],

    'states-mexico': [
      { value: 'cdmx', label: 'Mexico City' },
      { value: 'jal', label: 'Jalisco' },
      { value: 'nl', label: 'Nuevo León' },
      { value: 'pue', label: 'Puebla' },
      { value: 'yuc', label: 'Yucatán' },
      { value: 'ver', label: 'Veracruz' },
      { value: 'chi', label: 'Chihuahua' },
    ],

    'states-uk': [
      { value: 'eng', label: 'England' },
      { value: 'sco', label: 'Scotland' },
      { value: 'wal', label: 'Wales' },
      { value: 'ni', label: 'Northern Ireland' },
    ],

    // Cities by state (demonstrating large datasets)
    'cities-ca': MockApiService.generateCities('California', 50),
    'cities-ny': MockApiService.generateCities('New York', 50),
    'cities-tx': MockApiService.generateCities('Texas', 50),
    'cities-on': MockApiService.generateCities('Ontario', 40),
    'cities-qc': MockApiService.generateCities('Quebec', 40),
  };

  /**
   * Fetch options from mock API
   * Simulates network delay (500-1500ms)
   */
  fetchOptions(endpoint: string): Observable<FieldOption[]> {
    console.log(`[MockAPI] Fetching: ${endpoint}`);

    // Parse endpoint to extract resource and query params
    const [resource, queryString] = endpoint.split('?');
    const params = this.parseQueryParams(queryString);

    // Generate dynamic key based on resource and params
    let dataKey = resource.replace('/api/', '');

    // Handle dependent dropdowns (e.g., /api/states?country=usa)
    if (params['country']) {
      dataKey = `states-${params['country']}`;
    }
    if (params['state']) {
      dataKey = `cities-${params['state']}`;
    }

    // Get data from mock database
    const data = this.mockData[dataKey] || [];

    // Simulate network delay (500-1500ms)
    const delayMs = Math.random() * 1000 + 500;

    // Simulate occasional errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`Failed to fetch from ${endpoint}`);
    }

    return of(data).pipe(delay(delayMs));
  }

  /**
   * Validate field asynchronously
   * Simulates API validation (e.g., checking if username is available)
   */
  validateField(
    endpoint: string,
    data: { value: unknown; fieldName: string },
    method: 'GET' | 'POST'
  ): Observable<any> {
    console.log(`[MockAPI] Validating: ${endpoint}`, data);

    // Simulate network delay (300-800ms)
    const delayMs = Math.random() * 500 + 300;

    // Mock validation logic
    let response: any;

    // Example: username availability check
    if (endpoint.includes('username') || endpoint.includes('check-availability')) {
      const username = String(data.value).toLowerCase();
      const takenUsernames = ['admin', 'user', 'test', 'demo', 'root'];
      const isAvailable = !takenUsernames.includes(username);

      response = {
        valid: isAvailable,
        message: isAvailable ? 'Username is available' : 'Username is already taken'
      };
    }
    // Example: email domain validation
    else if (endpoint.includes('email')) {
      const email = String(data.value).toLowerCase();
      const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const domain = email.split('@')[1];
      const isValidDomain = allowedDomains.includes(domain);

      response = {
        valid: isValidDomain,
        message: isValidDomain ? 'Email domain is valid' : 'Please use a common email provider'
      };
    }
    // Default: always valid
    else {
      response = { valid: true };
    }

    // Simulate occasional errors (3% chance)
    if (Math.random() < 0.03) {
      throw new Error(`Validation API error for ${endpoint}`);
    }

    return of(response).pipe(delay(delayMs));
  }

  /**
   * Parse query string into key-value pairs
   */
  private parseQueryParams(queryString?: string): Record<string, string> {
    if (!queryString) return {};

    const params: Record<string, string> = {};
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    return params;
  }

  /**
   * Generate mock cities for demonstration
   */
  private static generateCities(
    stateName: string,
    count: number
  ): FieldOption[] {
    const cities: FieldOption[] = [];
    for (let i = 1; i <= count; i++) {
      cities.push({
        value: `city-${i}`,
        label: `${stateName} City ${i}`,
      });
    }
    return cities;
  }
}
