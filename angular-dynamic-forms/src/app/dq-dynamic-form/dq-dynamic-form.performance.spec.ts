import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DqDynamicForm } from './dq-dynamic-form';
import { FormSchema, Field } from './models/field.model';

/**
 * Performance Tests for Dynamic Forms
 *
 * These tests measure and validate performance characteristics:
 * - Component initialization time
 * - Rendering performance with varying form sizes
 * - Change detection performance
 * - Memory usage patterns
 * - Validation performance
 * - Computed field recalculation performance
 *
 * Performance Benchmarks:
 * - Small forms (1-10 fields): < 100ms initialization
 * - Medium forms (11-50 fields): < 500ms initialization
 * - Large forms (51-200 fields): < 2000ms initialization
 * - Very large forms (201-500 fields): < 5000ms initialization
 */

describe('DqDynamicForm - Performance Tests', () => {
  let component: DqDynamicForm;
  let fixture: ComponentFixture<DqDynamicForm>;

  // Performance thresholds (in milliseconds)
  const THRESHOLDS = {
    SMALL_FORM_INIT: 100,      // 1-10 fields
    MEDIUM_FORM_INIT: 500,     // 11-50 fields
    LARGE_FORM_INIT: 2000,     // 51-200 fields
    VERY_LARGE_FORM_INIT: 5000, // 201-500 fields
    CHANGE_DETECTION: 50,       // Single field change
    VALIDATION: 100,            // Full form validation
    COMPUTED_FIELD: 10          // Single computed field update
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DqDynamicForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DqDynamicForm);
    component = fixture.componentInstance;
  });

  /**
   * Utility: Measure execution time
   */
  const measureTime = async (fn: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  };

  /**
   * Utility: Generate form schema with N fields
   */
  const generateFormSchema = (fieldCount: number): FormSchema => {
    const fields: Field[] = [];

    for (let i = 0; i < fieldCount; i++) {
      const fieldType = ['text', 'email', 'number', 'select', 'checkbox', 'date', 'textarea'][i % 7];

      const field: Field = {
        type: fieldType,
        name: `field_${i}`,
        label: `Field ${i}`,
        validations: {
          required: i % 3 === 0 // Every 3rd field is required
        }
      };

      // Add options for select fields
      if (fieldType === 'select') {
        field.options = [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
          { value: 'opt3', label: 'Option 3' }
        ];
      }

      // Add min/max for number fields
      if (fieldType === 'number') {
        field.min = 0;
        field.max = 100;
      }

      fields.push(field);
    }

    return {
      title: `Performance Test Form (${fieldCount} fields)`,
      fields
    };
  };

  /**
   * Utility: Log performance results
   */
  const logPerformance = (testName: string, duration: number, threshold: number) => {
    const status = duration <= threshold ? '✓' : '✗';
    console.log(`${status} ${testName}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
  };

  describe('Component Initialization Performance', () => {
    it('should initialize small form (10 fields) quickly', async () => {
      const schema = generateFormSchema(10);

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Small form initialization', duration, THRESHOLDS.SMALL_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.SMALL_FORM_INIT);
    });

    it('should initialize medium form (50 fields) within threshold', async () => {
      const schema = generateFormSchema(50);

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Medium form initialization', duration, THRESHOLDS.MEDIUM_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.MEDIUM_FORM_INIT);
    });

    it('should initialize large form (200 fields) within threshold', async () => {
      const schema = generateFormSchema(200);

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Large form initialization', duration, THRESHOLDS.LARGE_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.LARGE_FORM_INIT);
    });

    it('should initialize very large form (500 fields) within threshold', async () => {
      const schema = generateFormSchema(500);

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Very large form initialization', duration, THRESHOLDS.VERY_LARGE_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.VERY_LARGE_FORM_INIT);
    });
  });

  describe('Change Detection Performance', () => {
    it('should handle single field change quickly', async () => {
      const schema = generateFormSchema(100);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        component['formValues'].set({
          ...component['formValues'](),
          field_0: 'test value'
        });
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Single field change', duration, THRESHOLDS.CHANGE_DETECTION);
      expect(duration).toBeLessThan(THRESHOLDS.CHANGE_DETECTION);
    });

    it('should handle multiple field changes efficiently', async () => {
      const schema = generateFormSchema(100);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        const values: Record<string, any> = {};
        for (let i = 0; i < 10; i++) {
          values[`field_${i}`] = `value_${i}`;
        }
        component['formValues'].set(values);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Multiple field changes (10 fields)', duration, THRESHOLDS.CHANGE_DETECTION * 2);
      expect(duration).toBeLessThan(THRESHOLDS.CHANGE_DETECTION * 2);
    });
  });

  describe('Validation Performance', () => {
    it('should validate small form quickly', async () => {
      const schema = generateFormSchema(10);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        const form = fixture.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit'));
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Small form validation', duration, THRESHOLDS.VALIDATION / 2);
      expect(duration).toBeLessThan(THRESHOLDS.VALIDATION / 2);
    });

    it('should validate large form within threshold', async () => {
      const schema = generateFormSchema(100);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        const form = fixture.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit'));
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Large form validation (100 fields)', duration, THRESHOLDS.VALIDATION);
      expect(duration).toBeLessThan(THRESHOLDS.VALIDATION);
    });

    it('should validate complex cross-field validations efficiently', async () => {
      const schema: FormSchema = {
        title: 'Cross-field Validation Test',
        fields: [
          { type: 'password', name: 'password', label: 'Password' },
          { type: 'password', name: 'confirm', label: 'Confirm', validations: { matchesField: 'password' } },
          { type: 'date', name: 'start', label: 'Start' },
          { type: 'date', name: 'end', label: 'End', validations: { greaterThanField: 'start' } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({
        password: 'test123',
        confirm: 'test456',
        start: '2025-01-01',
        end: '2024-12-31'
      });

      const duration = await measureTime(async () => {
        const form = fixture.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit'));
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Cross-field validation', duration, THRESHOLDS.VALIDATION);
      expect(duration).toBeLessThan(THRESHOLDS.VALIDATION);
    });
  });

  describe('Computed Fields Performance', () => {
    it('should update single computed field quickly', async () => {
      const schema: FormSchema = {
        title: 'Computed Field Test',
        fields: [
          { type: 'number', name: 'price', label: 'Price' },
          { type: 'number', name: 'quantity', label: 'Quantity' },
          {
            type: 'text',
            name: 'total',
            label: 'Total',
            readonly: true,
            computed: {
              formula: 'price * quantity',
              dependencies: ['price', 'quantity'],
              formatAs: 'number'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        component['formValues'].set({ price: 10, quantity: 5 });
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Single computed field update', duration, THRESHOLDS.COMPUTED_FIELD);
      expect(duration).toBeLessThan(THRESHOLDS.COMPUTED_FIELD);
    });

    it('should handle multiple computed fields efficiently', async () => {
      const fields: Field[] = [
        { type: 'number', name: 'base', label: 'Base Value' }
      ];

      // Add 10 computed fields
      for (let i = 0; i < 10; i++) {
        fields.push({
          type: 'text',
          name: `computed_${i}`,
          label: `Computed ${i}`,
          readonly: true,
          computed: {
            formula: `base * ${i + 1}`,
            dependencies: ['base'],
            formatAs: 'number'
          }
        });
      }

      const schema: FormSchema = { title: 'Multiple Computed Fields', fields };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        component['formValues'].set({ base: 10 });
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Multiple computed fields (10)', duration, THRESHOLDS.COMPUTED_FIELD * 5);
      expect(duration).toBeLessThan(THRESHOLDS.COMPUTED_FIELD * 5);
    });
  });

  describe('Conditional Visibility Performance', () => {
    it('should evaluate visibility conditions efficiently', async () => {
      const fields: Field[] = [
        { type: 'select', name: 'type', label: 'Type', options: [
          { value: 'a', label: 'Type A' },
          { value: 'b', label: 'Type B' }
        ]}
      ];

      // Add 20 conditionally visible fields
      for (let i = 0; i < 20; i++) {
        fields.push({
          type: 'text',
          name: `conditional_${i}`,
          label: `Conditional ${i}`,
          visibleWhen: {
            field: 'type',
            operator: 'equals',
            value: i % 2 === 0 ? 'a' : 'b'
          }
        });
      }

      const schema: FormSchema = { title: 'Conditional Visibility Test', fields };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        component['formValues'].set({ type: 'a' });
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Conditional visibility (20 fields)', duration, THRESHOLDS.CHANGE_DETECTION * 2);
      expect(duration).toBeLessThan(THRESHOLDS.CHANGE_DETECTION * 2);
    });

    it('should handle complex visibility conditions efficiently', async () => {
      const schema: FormSchema = {
        title: 'Complex Visibility Test',
        fields: [
          { type: 'number', name: 'age', label: 'Age' },
          { type: 'text', name: 'type', label: 'Type' },
          {
            type: 'text',
            name: 'conditional',
            label: 'Conditional Field',
            visibleWhen: {
              operator: 'and',
              conditions: [
                { field: 'age', operator: 'greaterThan', value: 18 },
                { field: 'age', operator: 'lessThan', value: 65 },
                { field: 'type', operator: 'equals', value: 'student' }
              ]
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const duration = await measureTime(async () => {
        component['formValues'].set({ age: 25, type: 'student' });
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Complex visibility conditions', duration, THRESHOLDS.CHANGE_DETECTION);
      expect(duration).toBeLessThan(THRESHOLDS.CHANGE_DETECTION);
    });
  });

  describe('Array Field Performance', () => {
    it('should handle array field with many items efficiently', async () => {
      const schema: FormSchema = {
        title: 'Array Performance Test',
        fields: [
          {
            type: 'array',
            name: 'items',
            label: 'Items',
            arrayConfig: {
              fields: [
                { type: 'text', name: 'name', label: 'Name' },
                { type: 'number', name: 'quantity', label: 'Quantity' }
              ],
              initialItems: 20,
              minItems: 1,
              maxItems: 50
            }
          }
        ]
      };

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Array field with 20 items', duration, THRESHOLDS.MEDIUM_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.MEDIUM_FORM_INIT);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when destroying large forms', async () => {
      const schema = generateFormSchema(100);

      // Get initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy form 5 times
      for (let i = 0; i < 5; i++) {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();

        fixture.destroy();

        // Recreate fixture
        fixture = TestBed.createComponent(DqDynamicForm);
        component = fixture.componentInstance;
      }

      // Get final memory usage
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory increase should be reasonable (less than 50% increase)
      if (initialMemory > 0) {
        const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
        console.log(`Memory increase after 5 form cycles: ${memoryIncrease.toFixed(2)}%`);
        expect(memoryIncrease).toBeLessThan(50);
      } else {
        console.log('Memory profiling not available in this environment');
      }
    });
  });

  describe('Rendering Performance', () => {
    it('should render form updates within 60fps budget (16.67ms)', async () => {
      const schema = generateFormSchema(50);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const FPS_60_BUDGET = 16.67; // milliseconds per frame

      const duration = await measureTime(async () => {
        component['formValues'].set({ field_0: 'new value' });
        fixture.detectChanges();
      });

      logPerformance('Single update (60fps budget)', duration, FPS_60_BUDGET);
      expect(duration).toBeLessThan(FPS_60_BUDGET);
    });

    it('should handle rapid successive updates efficiently', async () => {
      const schema = generateFormSchema(50);
      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const updateCount = 10;
      const duration = await measureTime(async () => {
        for (let i = 0; i < updateCount; i++) {
          component['formValues'].set({
            ...component['formValues'](),
            [`field_${i}`]: `value_${i}`
          });
          fixture.detectChanges();
        }
      });

      const averagePerUpdate = duration / updateCount;
      logPerformance(`Rapid updates (avg per update)`, averagePerUpdate, THRESHOLDS.CHANGE_DETECTION);
      expect(averagePerUpdate).toBeLessThan(THRESHOLDS.CHANGE_DETECTION);
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme form size (1000 fields)', async () => {
      const schema = generateFormSchema(1000);

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      const EXTREME_THRESHOLD = 10000; // 10 seconds
      logPerformance('Extreme form (1000 fields)', duration, EXTREME_THRESHOLD);
      expect(duration).toBeLessThan(EXTREME_THRESHOLD);
    });

    it('should handle form with deeply nested array fields', async () => {
      const schema: FormSchema = {
        title: 'Nested Arrays Stress Test',
        fields: [
          {
            type: 'array',
            name: 'level1',
            label: 'Level 1',
            arrayConfig: {
              fields: [
                { type: 'text', name: 'name', label: 'Name' },
                {
                  type: 'array',
                  name: 'level2',
                  label: 'Level 2',
                  arrayConfig: {
                    fields: [
                      { type: 'text', name: 'item', label: 'Item' }
                    ],
                    initialItems: 3
                  }
                }
              ],
              initialItems: 5
            }
          }
        ]
      };

      const duration = await measureTime(async () => {
        fixture.componentRef.setInput('formSchema', schema);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      logPerformance('Nested array fields', duration, THRESHOLDS.LARGE_FORM_INIT);
      expect(duration).toBeLessThan(THRESHOLDS.LARGE_FORM_INIT);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const schema = generateFormSchema(100);
      const runs = 5;
      const durations: number[] = [];

      for (let i = 0; i < runs; i++) {
        // Recreate component for fresh state
        fixture = TestBed.createComponent(DqDynamicForm);
        component = fixture.componentInstance;

        const duration = await measureTime(async () => {
          fixture.componentRef.setInput('formSchema', schema);
          fixture.detectChanges();
          await fixture.whenStable();
        });

        durations.push(duration);
      }

      const average = durations.reduce((a, b) => a + b, 0) / runs;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / runs;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = (standardDeviation / average) * 100;

      console.log(`Performance consistency (${runs} runs):`);
      console.log(`  Average: ${average.toFixed(2)}ms`);
      console.log(`  Std Dev: ${standardDeviation.toFixed(2)}ms`);
      console.log(`  CV: ${coefficientOfVariation.toFixed(2)}%`);

      // Performance should be consistent (CV < 20%)
      expect(coefficientOfVariation).toBeLessThan(20);
    });
  });
});
