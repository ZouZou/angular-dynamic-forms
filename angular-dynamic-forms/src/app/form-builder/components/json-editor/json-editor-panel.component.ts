import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ValidationResult } from '../../../dq-dynamic-form/dev-tools.service';

/**
 * JSON editor panel with validation results display
 */
@Component({
  selector: 'fb-json-editor-panel',
  template: `
    <div class="panel-header">
      <h2>💻 JSON Schema</h2>
    </div>

    <div class="panel-body">
      <!-- JSON Editor -->
      <section class="json-section">
        <textarea
          class="json-textarea"
          [value]="jsonContent()"
          (input)="jsonContentChanged.emit($any($event.target).value)"
          spellcheck="false"
        ></textarea>
      </section>

      <!-- Validation Results -->
      <section class="validation-section">
        <h3>
          @if (validationResult()?.isValid) {
            ✅ Valid Schema
          } @else {
            ❌ Validation Issues
          }
        </h3>

        @if (validationResult(); as result) {
          <!-- Summary -->
          <div class="validation-summary">
            <div class="summary-item">
              <strong>Total Fields:</strong> {{ result.summary.totalFields }}
            </div>
            <div class="summary-item">
              <strong>Required:</strong> {{ result.summary.requiredFields }}
            </div>
            <div class="summary-item">
              <strong>Errors:</strong> <span [class.error]="result.summary.errorCount > 0">{{ result.summary.errorCount }}</span>
            </div>
            <div class="summary-item">
              <strong>Warnings:</strong> <span [class.warning]="result.summary.warningCount > 0">{{ result.summary.warningCount }}</span>
            </div>
          </div>

          <!-- Errors -->
          @if (result.errors.length > 0) {
            <div class="validation-errors">
              <h4>❌ Errors</h4>
              <ul>
                @for (error of result.errors; track $index) {
                  <li class="error-item">{{ error }}</li>
                }
              </ul>
            </div>
          }

          <!-- Warnings -->
          @if (result.warnings.length > 0) {
            <div class="validation-warnings">
              <h4>⚠️ Warnings</h4>
              <ul>
                @for (warning of result.warnings; track $index) {
                  <li class="warning-item">{{ warning }}</li>
                }
              </ul>
            </div>
          }

          <!-- Field Types -->
          @if (result.summary.fieldTypes && getFieldTypesEntries(result.summary.fieldTypes).length > 0) {
            <div class="field-types">
              <h4>📊 Field Types</h4>
              <ul>
                @for (entry of getFieldTypesEntries(result.summary.fieldTypes); track entry[0]) {
                  <li>{{ entry[0] }}: {{ entry[1] }}</li>
                }
              </ul>
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .panel-header {
      padding: var(--spacing-lg);
      border-bottom: 2px solid var(--color-gray-200);
      background: var(--color-gray-50);

      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-gray-800);
        margin: 0;
      }
    }

    .panel-body {
      padding: var(--spacing-lg);
      overflow-y: auto;
      height: calc(100vh - 200px);
    }

    .json-section {
      margin-bottom: var(--spacing-lg);
    }

    .json-textarea {
      width: 100%;
      min-height: 400px;
      padding: var(--spacing-md);
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      border: 2px solid var(--color-gray-300);
      border-radius: var(--radius-md);
      background: white;
      color: var(--color-gray-900);
      resize: vertical;
      transition: border-color var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    }

    .validation-section {
      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 2px solid var(--color-gray-200);
      }
    }

    .validation-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
    }

    .summary-item {
      font-size: 0.875rem;

      strong {
        display: block;
        color: var(--color-gray-600);
        margin-bottom: 4px;
      }

      .error {
        color: var(--color-error);
        font-weight: 600;
      }

      .warning {
        color: var(--color-warning);
        font-weight: 600;
      }
    }

    .validation-errors,
    .validation-warnings,
    .field-types {
      margin-bottom: var(--spacing-lg);

      h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }
    }

    .validation-errors {
      .error-item {
        background: rgba(239, 68, 68, 0.1);
        color: var(--color-error);
        border-left: 3px solid var(--color-error);
      }
    }

    .validation-warnings {
      .warning-item {
        background: rgba(245, 158, 11, 0.1);
        color: var(--color-warning);
        border-left: 3px solid var(--color-warning);
      }
    }

    .field-types {
      li {
        background: var(--color-gray-50);
        color: var(--color-gray-700);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonEditorPanelComponent {
  // Inputs
  jsonContent = input.required<string>();
  validationResult = input<ValidationResult | null>(null);

  // Outputs
  jsonContentChanged = output<string>();

  protected getFieldTypesEntries(fieldTypes: Record<string, number>): Array<[string, number]> {
    return Object.entries(fieldTypes);
  }
}
