import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders textarea fields
 */
@Component({
  selector: 'dq-textarea-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <textarea
      class="form-control"
      [value]="value()"
      [placeholder]="field().placeholder || 'Enter ' + field().label.toLowerCase()"
      [rows]="field().rows || 4"
      [readonly]="field().readonly || false"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      (input)="onInput($any($event.target).value)"
      (blur)="onBlur()"
    ></textarea>
  `,
  styles: [SHARED_FIELD_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaFieldComponent {
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
