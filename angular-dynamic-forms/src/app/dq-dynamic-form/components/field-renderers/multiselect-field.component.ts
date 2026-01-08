import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Field, FieldOption } from '../../models/field.model';

/**
 * Renders multi-select fields (both native and searchable)
 */
@Component({
  selector: 'dq-multiselect-field',
  imports: [CommonModule, FormsModule, NgSelectModule],
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>

    @if (field().searchable) {
      <!-- Searchable Multi-Select with ng-select -->
      <ng-select
        [items]="options()"
        bindLabel="label"
        bindValue="value"
        [placeholder]="field().placeholder || 'Choose ' + field().label.toLowerCase()"
        [disabled]="disabled() || loading()"
        [ngModel]="value()"
        (ngModelChange)="onInput($event)"
        (blur)="onBlur()"
        [multiple]="true"
        [clearable]="!field().validations?.required"
        [searchable]="true"
        [closeOnSelect]="false"
        [loading]="loading()"
        [maxSelectedItems]="field().maxSelections"
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
      <!-- Native Multi-Select -->
      <select
        class="form-select"
        multiple
        [disabled]="disabled() || loading()"
        [size]="Math.min(options().length, 6)"
        [attr.aria-required]="field().validations?.required || null"
        [attr.aria-invalid]="touched() && error() ? 'true' : null"
        [attr.aria-describedby]="error() ? 'error-' + field().name : null"
        (change)="onMultiSelectChange($any($event.target).selectedOptions)"
        (blur)="onBlur()"
      >
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value" [selected]="isSelected(opt.value)">
            {{ opt.label }}
          </option>
        }
      </select>
      <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
    }

    @if (field().minSelections || field().maxSelections) {
      <small class="text-muted">
        @if (field().minSelections && field().maxSelections) {
          Select {{ field().minSelections }}-{{ field().maxSelections }} options
        } @else if (field().minSelections) {
          Select at least {{ field().minSelections }} options
        } @else if (field().maxSelections) {
          Select up to {{ field().maxSelections }} options
        }
      </small>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiselectFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>([]);
  touched = input<boolean>(false);
  error = input<string | null>(null);
  options = input<FieldOption[]>([]);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);

  // Expose Math for template
  protected readonly Math = Math;

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  protected onInput(newValue: unknown): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected onMultiSelectChange(selectedOptions: HTMLOptionsCollection): void {
    const selectedValues = Array.from(selectedOptions).map(opt => opt.value);
    this.valueChange.emit({
      fieldName: this.field().name,
      value: selectedValues
    });
  }

  protected isSelected(optionValue: unknown): boolean {
    const currentValue = this.value();
    if (!Array.isArray(currentValue)) return false;
    return currentValue.includes(optionValue);
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
