import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../../dq-dynamic-form/models/field.model';

/**
 * Editor for advanced field features: dependencies, visibility, masking, and computed fields
 */
@Component({
  selector: 'fb-advanced-field-editor',
  template: `
    <!-- Dependencies & Visibility Section -->
    <div class="advanced-section">
      <h4>🔗 Dependencies & Visibility</h4>

      <div class="form-group">
        <label>Depends On (field name)</label>
        <input
          type="text"
          [value]="getDependsOnValue(field())"
          (input)="fieldPropertyChanged.emit({property: 'dependsOn', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="e.g., country or country,state"
        >
        <small class="text-muted">Comma-separated for multiple dependencies</small>
      </div>

      <div class="form-group">
        <label>Options Endpoint URL</label>
        <input
          type="text"
          [value]="field().optionsEndpoint || ''"
          (input)="fieldPropertyChanged.emit({property: 'optionsEndpoint', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="https://api.example.com/options"
        >
        <small class="text-muted">API endpoint to fetch dynamic options</small>
      </div>

      @if (field().type === 'checkbox' && field().dependsOn) {
        <div class="form-group">
          <label>Dependency Type</label>
          <select
            [value]="field().dependencyType || 'same'"
            (change)="fieldPropertyChanged.emit({property: 'dependencyType', value: $any($event.target).value})"
            class="form-control"
          >
            <option value="same">Same (both checked/unchecked)</option>
            <option value="opposite">Opposite (inverse)</option>
          </select>
        </div>
      }

      <div class="form-group">
        <label>Visible When (JSON condition)</label>
        <textarea
          [value]="field().visibleWhen ? JSON.stringify(field().visibleWhen, null, 2) : ''"
          (input)="fieldPropertyJSONChanged.emit({property: 'visibleWhen', value: $any($event.target).value})"
          class="form-control"
          rows="3"
          placeholder='{"field": "country", "operator": "equals", "value": "US"}'
        ></textarea>
        <small class="text-muted">Conditional visibility configuration</small>
      </div>
    </div>

    <!-- Input Masking Section -->
    <div class="advanced-section">
      <h4>🎭 Input Masking</h4>

      <div class="form-group">
        <label>Mask Type</label>
        <select
          [value]="getMaskValue(field())"
          (change)="fieldPropertyChanged.emit({property: 'mask', value: $any($event.target).value || undefined})"
          class="form-control"
        >
          <option value="">None</option>
          <option value="phone">Phone - (123) 456-7890</option>
          <option value="phone-intl">Phone Intl - +1 (123) 456-7890</option>
          <option value="credit-card">Credit Card - 1234 5678 9012 3456</option>
          <option value="ssn">SSN - 123-45-6789</option>
          <option value="zip">ZIP - 12345</option>
          <option value="zip-plus4">ZIP+4 - 12345-6789</option>
          <option value="currency">Currency - $1,234.56</option>
          <option value="date-us">Date US - MM/DD/YYYY</option>
          <option value="time">Time - HH:MM</option>
        </select>
      </div>
    </div>

    <!-- Computed Field Section -->
    <div class="advanced-section">
      <h4>🧮 Computed Field</h4>

      <div class="form-group">
        <label>Formula</label>
        <input
          type="text"
          [value]="field().computed?.formula || ''"
          (input)="computedPropertyChanged.emit({property: 'formula', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder='e.g., price * quantity'
        >
        <small class="text-muted">Formula to auto-calculate value</small>
      </div>

      @if (field().computed?.formula) {
        <div class="form-group">
          <label>Dependencies (comma-separated)</label>
          <input
            type="text"
            [value]="field().computed?.dependencies?.join(', ') || ''"
            (input)="computedDependenciesChanged.emit($any($event.target).value)"
            class="form-control"
            placeholder="e.g., price, quantity"
          >
        </div>

        <div class="form-group">
          <label>Format As</label>
          <select
            [value]="field().computed?.formatAs || 'number'"
            (change)="computedPropertyChanged.emit({property: 'formatAs', value: $any($event.target).value})"
            class="form-control"
          >
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="text">Text</option>
          </select>
        </div>

        <div class="form-group">
          <label>Decimal Places</label>
          <input
            type="number"
            [value]="field().computed?.decimal || 2"
            (input)="computedPropertyChanged.emit({property: 'decimal', value: Number($any($event.target).value)})"
            class="form-control"
            min="0"
            max="10"
          >
        </div>

        <div class="form-group">
          <label>Prefix</label>
          <input
            type="text"
            [value]="field().computed?.prefix || ''"
            (input)="computedPropertyChanged.emit({property: 'prefix', value: $any($event.target).value || undefined})"
            class="form-control"
            placeholder='e.g., $, Total: '
          >
        </div>

        <div class="form-group">
          <label>Suffix</label>
          <input
            type="text"
            [value]="field().computed?.suffix || ''"
            (input)="computedPropertyChanged.emit({property: 'suffix', value: $any($event.target).value || undefined})"
            class="form-control"
            placeholder='e.g., %, kg'
          >
        </div>
      }
    </div>
  `,
  styles: [`
    .advanced-section {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid #ddd;
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .form-group {
      margin-bottom: var(--spacing-sm);

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-gray-700);
        margin-bottom: var(--spacing-xs);
      }

      .form-control {
        width: 100%;
        padding: var(--spacing-sm);
        font-size: 0.875rem;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--color-gray-900);
        transition: border-color var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      }

      textarea.form-control {
        resize: vertical;
        font-family: 'Courier New', monospace;
      }

      .text-muted {
        display: block;
        font-size: 0.75rem;
        color: var(--color-gray-500);
        margin-top: var(--spacing-xs);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedFieldEditorComponent {
  // Inputs
  field = input.required<Field>();

  // Outputs
  fieldPropertyChanged = output<{property: string; value: unknown}>();
  fieldPropertyJSONChanged = output<{property: string; value: string}>();
  computedPropertyChanged = output<{property: string; value: unknown}>();
  computedDependenciesChanged = output<string>();

  protected readonly Array = Array;
  protected readonly JSON = JSON;
  protected readonly Number = Number;

  protected getDependsOnValue(field: Field): string {
    const dependsOn = field.dependsOn;
    if (!dependsOn) return '';
    if (Array.isArray(dependsOn)) return dependsOn.join(', ');
    return dependsOn;
  }

  protected getMaskValue(field: Field): string {
    if (!field.mask) return '';
    if (typeof field.mask === 'string') return field.mask;
    return field.mask.type || '';
  }
}
