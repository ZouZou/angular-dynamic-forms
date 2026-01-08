import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';

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
