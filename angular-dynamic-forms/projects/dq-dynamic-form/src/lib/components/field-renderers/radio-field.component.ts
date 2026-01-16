import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field, FieldOption } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders radio button fields
 */
@Component({
  selector: 'dq-radio-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <div class="radio-group" [class.radio-horizontal]="field().layout === 'horizontal'">
      @for (opt of options(); track opt.value) {
        <div class="radio-option">
          <input
            type="radio"
            [name]="field().name"
            [value]="opt.value"
            [id]="field().name + '-' + opt.value"
            [checked]="value() === opt.value"
            [disabled]="field().disabled || false"
            [attr.aria-required]="field().validations?.required || null"
            [attr.aria-invalid]="touched() && error() ? 'true' : null"
            [attr.aria-describedby]="error() ? 'error-' + field().name : null"
            (change)="onInput(opt.value)"
          />
          <label [attr.for]="field().name + '-' + opt.value">{{ opt.label }}</label>
        </div>
      }
    </div>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .radio-group.radio-horizontal {
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      input[type="radio"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--color-primary);
        transition: transform var(--transition-fast);
      }

      input[type="radio"]:hover {
        transform: scale(1.1);
      }

      input[type="radio"]:focus,
      input[type="radio"]:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 2px;
      }

      input[type="radio"]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .radio-option label {
        cursor: pointer;
        font-size: 0.9375rem;
        color: var(--color-gray-700);
        margin: 0;
      }

      .radio-option:has(input:disabled) label {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>(null);
  touched = input<boolean>(false);
  error = input<string | null>(null);
  options = input<FieldOption[]>([]);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  protected onInput(newValue: unknown): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
