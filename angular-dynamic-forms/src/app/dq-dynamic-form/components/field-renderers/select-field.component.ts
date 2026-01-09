import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Field, FieldOption } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders select dropdown fields (both native and searchable)
 */
@Component({
  selector: 'dq-select-field',
  imports: [CommonModule, FormsModule, NgSelectModule],
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
      @if (loading()) {
        <span class="loading-indicator">Loading...</span>
      }
    </label>

    @if (field().searchable) {
      <!-- Searchable Select with ng-select -->
      <ng-select
        [items]="options()"
        bindLabel="label"
        bindValue="value"
        [placeholder]="field().placeholder || 'Choose ' + field().label.toLowerCase()"
        [disabled]="disabled() || loading()"
        [ngModel]="value()"
        (ngModelChange)="onInput($event)"
        (blur)="onBlur()"
        [clearable]="!field().validations?.required"
        [searchable]="true"
        [loading]="loading()"
        [attr.aria-required]="field().validations?.required || null"
        [attr.aria-invalid]="touched() && error() ? 'true' : null"
        [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      >
        @if (loading()) {
          <ng-template ng-loadingspinner-tmp>
            <span>Loading options...</span>
          </ng-template>
        }
        @if (!options() || options().length === 0) {
          <ng-template ng-notfound-tmp>
            <div class="ng-option disabled">No items found</div>
          </ng-template>
        }
      </ng-select>
    } @else {
      <!-- Native Select -->
      <select
        class="form-select"
        [disabled]="disabled() || loading()"
        [value]="value()"
        [attr.aria-required]="field().validations?.required || null"
        [attr.aria-invalid]="touched() && error() ? 'true' : null"
        [attr.aria-describedby]="error() ? 'error-' + field().name : null"
        (change)="onInput($any($event.target).value)"
        (blur)="onBlur()"
      >
        <option value="" [selected]="!value()">
          @if (loading()) {
            Loading options...
          } @else {
            Choose {{ field().label.toLowerCase() }}
          }
        </option>
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value" [selected]="value() === opt.value">
            {{ opt.label }}
          </option>
        }
      </select>
    }
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .loading-indicator {
        margin-left: auto;
        font-size: 0.75rem;
        color: var(--color-gray-500);
        font-weight: 400;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>(null);
  touched = input<boolean>(false);
  error = input<string | null>(null);
  options = input<FieldOption[]>([]);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);

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
