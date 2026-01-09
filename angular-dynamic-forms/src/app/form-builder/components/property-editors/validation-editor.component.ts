import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../../dq-dynamic-form/models/field.model';

/**
 * Editor for field validation properties
 */
@Component({
  selector: 'fb-validation-editor',
  template: `
    <div class="advanced-section">
      <h4>✅ Advanced Validations</h4>

      <div class="form-group">
        <label>Min Length</label>
        <input
          type="number"
          [value]="field().validations?.minLength || ''"
          (input)="validationPropertyChanged.emit({property: 'minLength', value: $any($event.target).value ? Number($any($event.target).value) : undefined})"
          class="form-control"
          min="0"
          placeholder="Minimum string length"
        >
      </div>

      <div class="form-group">
        <label>Max Length</label>
        <input
          type="number"
          [value]="field().validations?.maxLength || ''"
          (input)="validationPropertyChanged.emit({property: 'maxLength', value: $any($event.target).value ? Number($any($event.target).value) : undefined})"
          class="form-control"
          min="1"
          placeholder="Maximum string length"
        >
      </div>

      <div class="form-group">
        <label>Pattern (regex)</label>
        <input
          type="text"
          [value]="field().validations?.pattern || ''"
          (input)="validationPropertyChanged.emit({property: 'pattern', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="e.g., ^[A-Z][a-z]*$"
        >
      </div>

      <div class="form-group">
        <label>Custom Error Message</label>
        <input
          type="text"
          [value]="field().validations?.customMessage || ''"
          (input)="validationPropertyChanged.emit({property: 'customMessage', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="Custom validation error message"
        >
      </div>

      <div class="form-group">
        <label>Matches Field</label>
        <input
          type="text"
          [value]="field().validations?.matchesField || ''"
          (input)="validationPropertyChanged.emit({property: 'matchesField', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="e.g., password (for confirmation)"
        >
      </div>

      <div class="form-group">
        <label>Greater Than Field</label>
        <input
          type="text"
          [value]="field().validations?.greaterThanField || ''"
          (input)="validationPropertyChanged.emit({property: 'greaterThanField', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="Field name (for date/number comparison)"
        >
      </div>

      <div class="form-group">
        <label>Less Than Field</label>
        <input
          type="text"
          [value]="field().validations?.lessThanField || ''"
          (input)="validationPropertyChanged.emit({property: 'lessThanField', value: $any($event.target).value || undefined})"
          class="form-control"
          placeholder="Field name (for date/number comparison)"
        >
      </div>

      @if (field().type === 'checkbox') {
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().validations?.requiredTrue || false"
              (change)="validationPropertyChanged.emit({property: 'requiredTrue', value: $any($event.target).checked ? true : undefined})"
            >
            Required True (must be checked)
          </label>
        </div>
      }

      <div class="form-group">
        <label>Async Validator (JSON config)</label>
        <textarea
          [value]="field().validations?.asyncValidator ? JSON.stringify(field().validations?.asyncValidator, null, 2) : ''"
          (input)="asyncValidatorJSONChanged.emit($any($event.target).value)"
          class="form-control"
          rows="4"
          placeholder='{"endpoint": "https://api.example.com/validate", "method": "POST"}'
        ></textarea>
        <small class="text-muted">API-based async validation</small>
      </div>
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

      input[type="checkbox"] {
        width: auto;
        margin-right: var(--spacing-xs);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationEditorComponent {
  // Inputs
  field = input.required<Field>();

  // Outputs
  validationPropertyChanged = output<{property: string; value: unknown}>();
  asyncValidatorJSONChanged = output<string>();

  protected readonly JSON = JSON;
  protected readonly Number = Number;
}
