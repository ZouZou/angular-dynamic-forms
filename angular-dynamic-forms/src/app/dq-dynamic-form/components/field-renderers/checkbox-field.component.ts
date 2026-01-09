import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders checkbox fields
 */
@Component({
  selector: 'dq-checkbox-field',
  template: `
    <div class="checkbox-container">
      <input
        type="checkbox"
        [id]="field().name"
        [name]="field().name"
        [checked]="!!value()"
        [disabled]="field().disabled || false"
        [attr.aria-required]="field().validations?.requiredTrue || null"
        [attr.aria-invalid]="touched() && error() ? 'true' : null"
        [attr.aria-describedby]="error() ? 'error-' + field().name : null"
        (change)="onInput($any($event.target).checked)"
        (blur)="onBlur()"
      />
      <label [attr.for]="field().name">
        {{ field().label }}
        @if (field().validations?.requiredTrue) {
          <span class="required">*</span>
        }
      </label>
    </div>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .checkbox-container {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: var(--color-primary);
        transition: transform var(--transition-fast);
      }

      input[type="checkbox"]:hover {
        transform: scale(1.1);
      }

      input[type="checkbox"]:focus,
      input[type="checkbox"]:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 2px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>(false);
  touched = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  protected onInput(newValue: boolean): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
