import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders color picker fields
 */
@Component({
  selector: 'dq-color-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
      <span class="color-preview" [style.background-color]="value()"></span>
    </label>
    <input
      type="color"
      class="form-control color-picker"
      [value]="value()"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      (input)="onInput($any($event.target).value)"
      (blur)="onBlur()"
    />
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        border: 2px solid var(--color-gray-300);
        margin-left: auto;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .color-picker {
        height: 50px;
        padding: 4px;
        cursor: pointer;
      }

      .color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      .color-picker::-webkit-color-swatch {
        border: none;
        border-radius: var(--radius-sm);
      }

      .color-picker::-moz-color-swatch {
        border: none;
        border-radius: var(--radius-sm);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>('#000000');
  touched = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  protected onInput(newValue: string): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
