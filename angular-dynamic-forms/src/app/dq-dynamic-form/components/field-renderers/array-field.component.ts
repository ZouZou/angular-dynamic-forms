import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, FieldOption } from '../../models/field.model';
import { TextFieldComponent } from './text-field.component';
import { NumberFieldComponent } from './number-field.component';
import { TextareaFieldComponent } from './textarea-field.component';
import { SelectFieldComponent } from './select-field.component';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders repeating array fields with add/remove functionality
 */
@Component({
  selector: 'dq-array-field',
  imports: [
    CommonModule,
    TextFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent
  ],
  template: `
    <div class="array-field-container">
      <label class="form-label">{{ field().label }}</label>

      @for (index of arrayIndices(); track index) {
        <div class="array-item">
          <div class="array-item-header">
            <span class="array-item-label">
              {{ getItemLabel(index) }}
            </span>
            <button
              type="button"
              class="array-remove-btn"
              [disabled]="!canRemove()"
              (click)="onRemoveItem(index)"
              [title]="'Remove this item'"
            >
              {{ field().arrayConfig?.removeButtonText || 'Remove' }}
            </button>
          </div>

          <div class="array-item-fields">
            @for (subField of field().arrayConfig?.fields || []; track subField.name) {
              <div class="form-group" [class]="'width-' + (subField.width || 'full')">

                <!-- Text / Email / Password -->
                @if (subField.type === 'text' || subField.type === 'email' || subField.type === 'password') {
                  <dq-text-field
                    [field]="subField"
                    [value]="getSubFieldValue(index, subField.name)"
                    [touched]="getSubFieldTouched(index, subField.name)"
                    [error]="getSubFieldError(index, subField.name)"
                    (valueChange)="onSubFieldChange(index, subField.name, $event.value)"
                    (blur)="onSubFieldBlur(index, subField.name)"
                  />
                }

                <!-- Number -->
                @if (subField.type === 'number') {
                  <dq-number-field
                    [field]="subField"
                    [value]="getSubFieldValue(index, subField.name)"
                    [touched]="getSubFieldTouched(index, subField.name)"
                    [error]="getSubFieldError(index, subField.name)"
                    (valueChange)="onSubFieldChange(index, subField.name, $event.value)"
                    (blur)="onSubFieldBlur(index, subField.name)"
                  />
                }

                <!-- Textarea -->
                @if (subField.type === 'textarea') {
                  <dq-textarea-field
                    [field]="subField"
                    [value]="getSubFieldValue(index, subField.name)"
                    [touched]="getSubFieldTouched(index, subField.name)"
                    [error]="getSubFieldError(index, subField.name)"
                    (valueChange)="onSubFieldChange(index, subField.name, $event.value)"
                    (blur)="onSubFieldBlur(index, subField.name)"
                  />
                }

                <!-- Select -->
                @if (subField.type === 'select') {
                  <dq-select-field
                    [field]="subField"
                    [value]="getSubFieldValue(index, subField.name)"
                    [touched]="getSubFieldTouched(index, subField.name)"
                    [error]="getSubFieldError(index, subField.name)"
                    [options]="normalizeOptions(subField.options || [])"
                    (valueChange)="onSubFieldChange(index, subField.name, $event.value)"
                    (blur)="onSubFieldBlur(index, subField.name)"
                  />
                }

                <!-- Error Display -->
                @if (getSubFieldTouched(index, subField.name) && getSubFieldError(index, subField.name)) {
                  <div class="error">
                    {{ getSubFieldError(index, subField.name) }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <button
        type="button"
        class="array-add-btn"
        [disabled]="!canAdd()"
        (click)="onAddItem()"
      >
        {{ getAddButtonText() }}
      </button>
    </div>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .array-field-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .array-item {
        padding: var(--spacing-md);
        border: 2px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        background-color: var(--color-gray-50);
      }

      .array-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--color-gray-300);
      }

      .array-item-label {
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--color-gray-700);
      }

      .array-remove-btn {
        padding: 6px 12px;
        background-color: white;
        border: 1px solid var(--color-danger);
        color: var(--color-danger);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .array-remove-btn:hover:not(:disabled) {
        background-color: var(--color-danger);
        color: white;
      }

      .array-remove-btn:focus,
      .array-remove-btn:focus-visible {
        outline: 2px solid var(--color-danger);
        outline-offset: 2px;
      }

      .array-remove-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .array-item-fields {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: var(--spacing-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .form-group.width-full {
        grid-column: span 12;
      }

      .form-group.width-half {
        grid-column: span 6;
      }

      .form-group.width-third {
        grid-column: span 4;
      }

      .form-group.width-quarter {
        grid-column: span 3;
      }

      .error {
        color: var(--color-danger);
        font-size: 0.8125rem;
        margin-top: var(--spacing-xs);
      }

      .array-add-btn {
        padding: 10px 16px;
        background-color: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 0.9375rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        align-self: flex-start;
      }

      .array-add-btn:hover:not(:disabled) {
        background-color: var(--color-primary-dark);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .array-add-btn:focus,
      .array-add-btn:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 2px;
      }

      .array-add-btn:disabled {
        background-color: var(--color-gray-300);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArrayFieldComponent {
  // Inputs
  field = input.required<Field>();
  arrayIndices = input<number[]>([]);
  formValues = input<Record<string, unknown>>({});
  touched = input<Record<string, boolean>>({});
  errors = input<Record<string, string>>({});

  // Outputs
  addItem = output<string>();
  removeItem = output<{ fieldName: string; index: number }>();
  subFieldChange = output<{ fieldName: string; value: unknown }>();
  subFieldBlur = output<string>();

  protected getItemLabel(index: number): string {
    const config = this.field().arrayConfig;
    if (!config) return '';

    const itemLabel = config.itemLabel || '{label} {index}';
    return itemLabel
      .replace('{label}', this.field().label)
      .replace('{index}', (index + 1).toString());
  }

  protected getAddButtonText(): string {
    const config = this.field().arrayConfig;
    if (!config) return '+ Add';

    const buttonText = config.addButtonText || '+ Add {label}';
    return buttonText.replace('{label}', this.field().label);
  }

  protected canAdd(): boolean {
    const config = this.field().arrayConfig;
    if (!config) return false;

    const currentCount = this.arrayIndices().length;
    return !config.maxItems || currentCount < config.maxItems;
  }

  protected canRemove(): boolean {
    const config = this.field().arrayConfig;
    if (!config) return false;

    const currentCount = this.arrayIndices().length;
    return currentCount > (config.minItems || 0);
  }

  protected getArrayFieldName(index: number, subFieldName: string): string {
    return `${this.field().name}[${index}].${subFieldName}`;
  }

  protected getSubFieldValue(index: number, subFieldName: string): unknown {
    const fieldName = this.getArrayFieldName(index, subFieldName);
    return this.formValues()[fieldName];
  }

  protected getSubFieldTouched(index: number, subFieldName: string): boolean {
    const fieldName = this.getArrayFieldName(index, subFieldName);
    return this.touched()[fieldName] || false;
  }

  protected getSubFieldError(index: number, subFieldName: string): string | null {
    const fieldName = this.getArrayFieldName(index, subFieldName);
    return this.errors()[fieldName] || null;
  }

  protected normalizeOptions(options: unknown): FieldOption[] {
    if (!Array.isArray(options)) return [];
    return options.map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: String(opt), label: String(opt) };
      }
      return opt as FieldOption;
    });
  }

  protected onAddItem(): void {
    this.addItem.emit(this.field().name);
  }

  protected onRemoveItem(index: number): void {
    this.removeItem.emit({
      fieldName: this.field().name,
      index: index
    });
  }

  protected onSubFieldChange(index: number, subFieldName: string, value: unknown): void {
    const fieldName = this.getArrayFieldName(index, subFieldName);
    this.subFieldChange.emit({ fieldName, value });
  }

  protected onSubFieldBlur(index: number, subFieldName: string): void {
    const fieldName = this.getArrayFieldName(index, subFieldName);
    this.subFieldBlur.emit(fieldName);
  }
}
