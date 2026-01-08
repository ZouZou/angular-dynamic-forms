import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';

/**
 * Renders text, email, and password input fields
 */
@Component({
  selector: 'dq-text-field',
  template: `
    <label class="form-label" [id]="'label-' + field().name" [attr.for]="field().name">
      {{ field().label }}
      @if (field().validations?.required || field().validations?.requiredIf) {
        <span class="required" aria-label="required">*</span>
      }
      @if (field().mask) {
        <span class="mask-hint" [title]="'Format: ' + maskPattern()">
          ({{ maskPattern() }})
        </span>
      }
      @if (field().validations?.asyncValidator) {
        @if (asyncValidationState() === 'validating') {
          <span class="async-validation-indicator validating" role="status" aria-live="polite">⏳ Validating...</span>
        }
        @if (asyncValidationState() === 'valid') {
          <span class="async-validation-indicator valid" role="status" aria-live="polite">✓ Valid</span>
        }
      }
    </label>
    <input
      [type]="field().type"
      [id]="field().name"
      [name]="field().name"
      class="form-control"
      [class.masked-input]="!!field().mask"
      [value]="value()"
      [placeholder]="field().placeholder || (field().mask ? maskPattern() : 'Enter ' + field().label.toLowerCase())"
      [readonly]="field().readonly || !!field().computed || false"
      [disabled]="field().disabled || false"
      [attr.maxlength]="maxLength()"
      [attr.aria-required]="field().validations?.required || field().validations?.requiredIf || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      [attr.title]="field().mask ? 'Format: ' + maskPattern() : null"
      (input)="onInput($any($event.target).value)"
      (blur)="onBlur()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>('');
  touched = input<boolean>(false);
  error = input<string | null>(null);
  asyncValidationState = input<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  maskPattern = input<string>('');
  maxLength = input<number | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown; isMasked: boolean }>();
  blur = output<string>();

  protected onInput(newValue: string): void {
    const isMasked = !!this.field().mask;
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue,
      isMasked
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
