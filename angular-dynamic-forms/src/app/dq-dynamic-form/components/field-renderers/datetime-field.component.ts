import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';

/**
 * Renders datetime-local fields
 */
@Component({
  selector: 'dq-datetime-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <input
      type="datetime-local"
      class="form-control"
      [value]="value()"
      [min]="field().min"
      [max]="field().max"
      [placeholder]="field().placeholder || 'Select date and time'"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      (input)="onInput($any($event.target).value)"
      (blur)="onBlur()"
    />
    @if (field().timezone) {
      <small class="text-muted">Timezone: {{ field().timezone }}</small>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimeFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>('');
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
