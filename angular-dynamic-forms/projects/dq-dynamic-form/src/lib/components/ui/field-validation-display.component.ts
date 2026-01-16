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
  styles: [`
    .text-muted {
      display: block;
      margin-top: var(--spacing-sm);
      font-size: 0.8125rem;
      color: var(--color-gray-500);
      font-style: italic;
    }

    .text-error {
      display: block;
      margin-top: var(--spacing-sm);
      font-size: 0.8125rem;
      color: var(--color-error);
      font-weight: 500;
    }

    .error {
      margin-top: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: #fef2f2;
      border-left: 3px solid var(--color-error);
      border-radius: var(--radius-sm);
      color: var(--color-error);
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      animation: shake 0.3s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `],
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
