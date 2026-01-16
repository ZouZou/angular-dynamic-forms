import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from 'dq-dynamic-form';

/**
 * Editor for datatable field configuration
 * Note: This is a simplified version handling the main configuration options.
 * Column actions and advanced settings are managed through parent component methods.
 */
@Component({
  selector: 'fb-datatable-config-editor',
  template: `
    @if (field().type === 'datatable' && field().tableConfig) {
      <div class="datatable-config-section">
        <h4>📊 DataTable Configuration</h4>

        <!-- Columns Management -->
        <h5>Columns</h5>
        <p class="help-text">Column configuration is complex and handled in the main editor interface.</p>
        <button
          class="btn btn-primary"
          (click)="addColumnClicked.emit()"
        >
          ➕ Add Column
        </button>

        <!-- Data Source -->
        <h5>Data Source</h5>
        <div class="form-group">
          <label>Data Endpoint (API URL for dynamic data)</label>
          <input
            type="text"
            [value]="field().tableConfig!.dataEndpoint || ''"
            (input)="tableConfigChanged.emit({property: 'dataEndpoint', value: $any($event.target).value || undefined})"
            class="form-control"
            placeholder="https://api.example.com/data"
          >
          <small class="text-muted">Leave empty to use static rows data</small>
        </div>

        <!-- Pagination Settings -->
        <h5>Pagination</h5>
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().tableConfig!.pagination?.enabled ?? true"
              (change)="tableConfigNestedChanged.emit({parent: 'pagination', property: 'enabled', value: $any($event.target).checked})"
            >
            Enable Pagination
          </label>
        </div>

        @if (field().tableConfig!.pagination?.enabled ?? true) {
          <div class="form-group">
            <label>Rows Per Page</label>
            <input
              type="number"
              [value]="field().tableConfig!.pagination?.rowsPerPage || 10"
              (input)="tableConfigNestedChanged.emit({parent: 'pagination', property: 'rowsPerPage', value: Number($any($event.target).value)})"
              class="form-control"
              min="1"
            >
          </div>

          <div class="form-group">
            <label>Rows Per Page Options (comma-separated)</label>
            <input
              type="text"
              [value]="(field().tableConfig!.pagination?.rowsPerPageOptions || [10, 25, 50, 100]).join(', ')"
              (input)="rowsPerPageOptionsChanged.emit($any($event.target).value)"
              class="form-control"
              placeholder="10, 25, 50, 100"
            >
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().tableConfig!.pagination?.showPageInfo ?? true"
                (change)="tableConfigNestedChanged.emit({parent: 'pagination', property: 'showPageInfo', value: $any($event.target).checked})"
              >
              Show Page Info (e.g., "1-10 of 100")
            </label>
          </div>
        }

        <!-- Filter Settings -->
        <h5>Search & Filter</h5>
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().tableConfig!.filter?.enabled ?? true"
              (change)="tableConfigNestedChanged.emit({parent: 'filter', property: 'enabled', value: $any($event.target).checked})"
            >
            Enable Global Search
          </label>
        </div>

        @if (field().tableConfig!.filter?.enabled ?? true) {
          <div class="form-group">
            <label>Search Placeholder</label>
            <input
              type="text"
              [value]="field().tableConfig!.filter?.placeholder || 'Search...'"
              (input)="tableConfigNestedChanged.emit({parent: 'filter', property: 'placeholder', value: $any($event.target).value})"
              class="form-control"
              placeholder="Search..."
            >
          </div>

          <div class="form-group">
            <label>Debounce (ms)</label>
            <input
              type="number"
              [value]="field().tableConfig!.filter?.debounceMs || 300"
              (input)="tableConfigNestedChanged.emit({parent: 'filter', property: 'debounceMs', value: Number($any($event.target).value)})"
              class="form-control"
              min="0"
            >
          </div>
        }

        <!-- Selection Settings -->
        <h5>Row Selection</h5>
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().tableConfig!.selection?.enabled || false"
              (change)="tableConfigNestedChanged.emit({parent: 'selection', property: 'enabled', value: $any($event.target).checked})"
            >
            Enable Row Selection
          </label>
        </div>

        @if (field().tableConfig!.selection?.enabled) {
          <div class="form-group">
            <label>Selection Mode</label>
            <select
              [value]="field().tableConfig!.selection?.mode || 'multiple'"
              (change)="tableConfigNestedChanged.emit({parent: 'selection', property: 'mode', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="single">Single</option>
              <option value="multiple">Multiple</option>
            </select>
          </div>

          @if (field().tableConfig!.selection?.mode === 'multiple' || !field().tableConfig!.selection?.mode) {
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().tableConfig!.selection?.showSelectAll ?? true"
                  (change)="tableConfigNestedChanged.emit({parent: 'selection', property: 'showSelectAll', value: $any($event.target).checked})"
                >
                Show Select All Checkbox
              </label>
            </div>
          }
        }

        <!-- Styling Options -->
        <h5>Styling</h5>
        <div class="styling-grid">
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().tableConfig!.striped || false"
                (change)="tableConfigChanged.emit({property: 'striped', value: $any($event.target).checked})"
              >
              Striped Rows
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().tableConfig!.bordered ?? true"
                (change)="tableConfigChanged.emit({property: 'bordered', value: $any($event.target).checked})"
              >
              Bordered
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().tableConfig!.hoverable || false"
                (change)="tableConfigChanged.emit({property: 'hoverable', value: $any($event.target).checked})"
              >
              Hoverable Rows
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().tableConfig!.dense || false"
                (change)="tableConfigChanged.emit({property: 'dense', value: $any($event.target).checked})"
              >
              Compact/Dense
            </label>
          </div>
        </div>

        <!-- Other Options -->
        <h5>Other Options</h5>
        <div class="form-group">
          <label>Empty Message</label>
          <input
            type="text"
            [value]="field().tableConfig!.emptyMessage || 'No data available'"
            (input)="tableConfigChanged.emit({property: 'emptyMessage', value: $any($event.target).value})"
            class="form-control"
            placeholder="No data available"
          >
        </div>
      </div>
    }
  `,
  styles: [`
    .datatable-config-section {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid #ddd;
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-md) 0;
    }

    h5 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-600);
      margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    }

    .help-text {
      font-size: 0.75rem;
      color: var(--color-gray-500);
      margin-bottom: var(--spacing-sm);
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

      .text-muted {
        display: block;
        font-size: 0.75rem;
        color: var(--color-gray-500);
        margin-top: var(--spacing-xs);
      }

      input[type="checkbox"] {
        width: auto;
        margin-right: var(--spacing-xs);
      }
    }

    .styling-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
    }

    .btn {
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      width: 100%;
      margin-bottom: var(--spacing-md);

      &.btn-primary {
        background: var(--color-primary);
        color: white;

        &:hover {
          background: var(--color-primary-dark);
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableConfigEditorComponent {
  // Inputs
  field = input.required<Field>();

  // Outputs
  tableConfigChanged = output<{property: string; value: unknown}>();
  tableConfigNestedChanged = output<{parent: string; property: string; value: unknown}>();
  rowsPerPageOptionsChanged = output<string>();
  addColumnClicked = output<void>();

  protected readonly Number = Number;
}
