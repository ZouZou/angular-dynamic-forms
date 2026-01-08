import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field, FieldOption } from '../../models/field.model';

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
