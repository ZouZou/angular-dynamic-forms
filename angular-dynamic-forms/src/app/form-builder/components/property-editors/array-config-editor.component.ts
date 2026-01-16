import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from 'dq-dynamic-form';

/**
 * Editor for array field configuration
 */
@Component({
  selector: 'fb-array-config-editor',
  template: `
    @if (field().type === 'array' && field().arrayConfig) {
      <div class="array-config-section">
        <h4>🔁 Array Configuration</h4>

        <div class="form-group">
          <label>Minimum Items</label>
          <input
            type="number"
            [value]="field().arrayConfig!.minItems || 0"
            (input)="arrayConfigChanged.emit({property: 'minItems', value: Number($any($event.target).value)})"
            class="form-control"
            min="0"
          >
        </div>

        <div class="form-group">
          <label>Maximum Items</label>
          <input
            type="number"
            [value]="field().arrayConfig!.maxItems || ''"
            (input)="arrayConfigChanged.emit({property: 'maxItems', value: $any($event.target).value ? Number($any($event.target).value) : undefined})"
            class="form-control"
            min="1"
            placeholder="Unlimited"
          >
        </div>

        <div class="form-group">
          <label>Initial Items</label>
          <input
            type="number"
            [value]="field().arrayConfig!.initialItems || 1"
            (input)="arrayConfigChanged.emit({property: 'initialItems', value: Number($any($event.target).value)})"
            class="form-control"
            min="0"
          >
        </div>

        <div class="form-group">
          <label>Add Button Text</label>
          <input
            type="text"
            [value]="field().arrayConfig!.addButtonText || ''"
            (input)="arrayConfigChanged.emit({property: 'addButtonText', value: $any($event.target).value})"
            class="form-control"
            placeholder="Add Item"
          >
        </div>

        <div class="form-group">
          <label>Remove Button Text</label>
          <input
            type="text"
            [value]="field().arrayConfig!.removeButtonText || ''"
            (input)="arrayConfigChanged.emit({property: 'removeButtonText', value: $any($event.target).value})"
            class="form-control"
            placeholder="Remove"
          >
        </div>

        <h5>Sub-Fields</h5>
        <div class="array-subfields">
          @for (subField of field().arrayConfig!.fields || []; track $index) {
            <div class="subfield-item">
              <div class="form-group">
                <label>Type</label>
                <select
                  [value]="subField.type"
                  (change)="subFieldPropertyChanged.emit({index: $index, property: 'type', value: $any($event.target).value})"
                  class="form-control"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="password">Password</option>
                  <option value="number">Number</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div class="form-group">
                <label>Name</label>
                <input
                  type="text"
                  [value]="subField.name"
                  (input)="subFieldPropertyChanged.emit({index: $index, property: 'name', value: $any($event.target).value})"
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label>Label</label>
                <input
                  type="text"
                  [value]="subField.label"
                  (input)="subFieldPropertyChanged.emit({index: $index, property: 'label', value: $any($event.target).value})"
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label>Placeholder</label>
                <input
                  type="text"
                  [value]="subField.placeholder || ''"
                  (input)="subFieldPropertyChanged.emit({index: $index, property: 'placeholder', value: $any($event.target).value})"
                  class="form-control"
                >
              </div>

              <button
                class="btn btn-danger btn-sm"
                (click)="subFieldRemoved.emit($index)"
              >
                🗑️ Remove Sub-Field
              </button>
            </div>
          }

          <button
            class="btn btn-primary"
            (click)="subFieldAdded.emit()"
          >
            ➕ Add Sub-Field
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .array-config-section {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid #ddd;
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-sm) 0;
    }

    h5 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-600);
      margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    }

    .form-group {
      margin-bottom: var(--spacing-sm);

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-gray-700);
        margin-bottom: var(--spacing-xs);
      }

      .form-control {
        width: 100%;
        padding: var(--spacing-sm);
        font-size: 0.875rem;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--color-gray-900);
        transition: border-color var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      }
    }

    .array-subfields {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .subfield-item {
      border: 1px solid #ddd;
      padding: var(--spacing-sm);
      border-radius: var(--radius-sm);
      background-color: #f9f9f9;

      .form-group {
        margin-bottom: var(--spacing-sm);

        label {
          font-size: 0.8125rem;
        }
      }

      .btn {
        width: 100%;
        margin-top: var(--spacing-sm);
      }
    }

    .btn {
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);

      &.btn-primary {
        background: var(--color-primary);
        color: white;

        &:hover {
          background: var(--color-primary-dark);
        }
      }

      &.btn-danger {
        background: var(--color-error);
        color: white;

        &:hover {
          background: var(--color-error-dark);
        }
      }

      &.btn-sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.8125rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArrayConfigEditorComponent {
  // Inputs
  field = input.required<Field>();

  // Outputs
  arrayConfigChanged = output<{property: string; value: unknown}>();
  subFieldPropertyChanged = output<{index: number; property: string; value: unknown}>();
  subFieldAdded = output<void>();
  subFieldRemoved = output<number>();

  protected readonly Number = Number;
}
