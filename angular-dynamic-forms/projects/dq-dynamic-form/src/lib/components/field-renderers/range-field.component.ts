import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders range slider fields
 */
@Component({
  selector: 'dq-range-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
      <span class="range-value">{{ value() }}</span>
    </label>
    <input
      type="range"
      class="form-range"
      [value]="value()"
      [min]="field().min || 0"
      [max]="field().max || 100"
      [step]="field().step || 1"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      [attr.aria-valuemin]="field().min || 0"
      [attr.aria-valuemax]="field().max || 100"
      [attr.aria-valuenow]="value()"
      (input)="onInput($any($event.target).valueAsNumber)"
      (blur)="onBlur()"
    />
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .range-value {
        margin-left: auto;
        font-weight: 700;
        color: var(--color-primary);
        font-size: 0.875rem;
      }

      .form-range {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--color-gray-200);
        outline: none;
        cursor: pointer;
        transition: opacity var(--transition-fast);
        -webkit-appearance: none;
        appearance: none;
      }

      .form-range:hover {
        opacity: 0.9;
      }

      .form-range:focus,
      .form-range:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 2px;
      }

      .form-range:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .form-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        transition: transform var(--transition-fast);
      }

      .form-range::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .form-range::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        transition: transform var(--transition-fast);
      }

      .form-range::-moz-range-thumb:hover {
        transform: scale(1.2);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>(0);
  touched = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  protected onInput(newValue: number): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
