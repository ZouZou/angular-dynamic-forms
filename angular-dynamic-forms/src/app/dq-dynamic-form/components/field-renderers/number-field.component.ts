import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';

/**
 * Renders number input fields
 */
@Component({
  selector: 'dq-number-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <input
      type="number"
      class="form-control"
      [value]="value()"
      [placeholder]="field().placeholder || 'Enter ' + field().label.toLowerCase()"
      [min]="field().min"
      [max]="field().max"
      [step]="field().step || 1"
      [readonly]="field().readonly || false"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      (input)="onInput($any($event.target).valueAsNumber)"
      (blur)="onBlur()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumberFieldComponent {
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
