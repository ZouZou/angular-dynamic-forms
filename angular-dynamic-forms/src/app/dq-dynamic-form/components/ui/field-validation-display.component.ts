import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Renders field-level validation messages and hints
 */
@Component({
  selector: 'dq-field-validation-display',
  template: `
    @if (disabled()) {
      <small class="text-muted">{{ disabledMessage() }}</small>
    }

    @if (fieldError()) {
      <small class="text-error">{{ fieldError() }}</small>
    }

    @if (touched() && error()) {
      <div [id]="'error-' + fieldName()" class="error" role="alert" aria-live="assertive">
        {{ error() }}
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldValidationDisplayComponent {
  // Inputs
  fieldName = input.required<string>();
  error = input<string | null>(null);
  fieldError = input<string | null>(null);  // For field-level errors (like dependencies)
  touched = input<boolean>(false);
  disabled = input<boolean>(false);
  disabledMessage = input<string>('Please fill in required dependencies first');
}
