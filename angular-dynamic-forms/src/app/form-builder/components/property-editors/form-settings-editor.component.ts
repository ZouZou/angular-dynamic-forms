import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormSchema } from '../../../dq-dynamic-form/models/field.model';

/**
 * Editor for form-level settings: metadata, submission, and autosave configuration
 */
@Component({
  selector: 'fb-form-settings-editor',
  template: `
    <section class="form-settings-section">
      <h3>⚙️ Form Settings</h3>
      <div class="settings-form">
        <!-- Form Metadata -->
        <div class="settings-group">
          <h4>📝 Form Metadata</h4>

          <div class="form-group">
            <label>Form Title</label>
            <input
              type="text"
              [value]="schema().title"
              (input)="formPropertyChanged.emit({property: 'title', value: $any($event.target).value})"
              class="form-control"
              placeholder="Enter form title"
            >
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              [value]="schema().description || ''"
              (input)="formPropertyChanged.emit({property: 'description', value: $any($event.target).value})"
              class="form-control"
              rows="2"
              placeholder="Optional form description"
            ></textarea>
          </div>
        </div>

        <!-- Submission Configuration -->
        <div class="settings-group">
          <h4>📤 Submission Configuration</h4>

          <div class="form-group">
            <label>API Endpoint</label>
            <input
              type="text"
              [value]="schema().submission?.endpoint || ''"
              (input)="submissionPropertyChanged.emit({property: 'endpoint', value: $any($event.target).value || undefined})"
              class="form-control"
              placeholder="https://api.example.com/submit"
            >
            <small class="text-muted">Leave empty to display data locally</small>
          </div>

          <div class="form-group">
            <label>HTTP Method</label>
            <select
              [value]="schema().submission?.method || 'POST'"
              (change)="submissionPropertyChanged.emit({property: 'method', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div class="form-group">
            <label>Success Message</label>
            <input
              type="text"
              [value]="schema().submission?.successMessage || ''"
              (input)="submissionPropertyChanged.emit({property: 'successMessage', value: $any($event.target).value || undefined})"
              class="form-control"
              placeholder="Form submitted successfully!"
            >
          </div>

          <div class="form-group">
            <label>Error Message</label>
            <input
              type="text"
              [value]="schema().submission?.errorMessage || ''"
              (input)="submissionPropertyChanged.emit({property: 'errorMessage', value: $any($event.target).value || undefined})"
              class="form-control"
              placeholder="Error submitting form. Please try again."
            >
          </div>

          <div class="form-group">
            <label>Redirect URL (on success)</label>
            <input
              type="text"
              [value]="schema().submission?.redirectOnSuccess || ''"
              (input)="submissionPropertyChanged.emit({property: 'redirectOnSuccess', value: $any($event.target).value || undefined})"
              class="form-control"
              placeholder="/thank-you"
            >
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="schema().submission?.showDataOnSuccess || false"
                (change)="submissionPropertyChanged.emit({property: 'showDataOnSuccess', value: $any($event.target).checked})"
              >
              Show data on success
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="schema().submission?.showSubmitButton !== false"
                (change)="submissionPropertyChanged.emit({property: 'showSubmitButton', value: $any($event.target).checked})"
              >
              Show submit button
            </label>
          </div>

          <div class="form-group">
            <label>Custom Headers (JSON)</label>
            <textarea
              [value]="schema().submission?.headers ? JSON.stringify(schema().submission?.headers, null, 2) : ''"
              (input)="submissionHeadersJSONChanged.emit($any($event.target).value)"
              class="form-control"
              rows="3"
              placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
            ></textarea>
            <small class="text-muted">Optional custom HTTP headers</small>
          </div>
        </div>

        <!-- Autosave Configuration -->
        <div class="settings-group">
          <h4>💾 Autosave Configuration</h4>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="schema().autosave?.enabled || false"
                (change)="autosavePropertyChanged.emit({property: 'enabled', value: $any($event.target).checked})"
              >
              Enable autosave
            </label>
          </div>

          @if (schema().autosave?.enabled) {
            <div class="form-group">
              <label>Save Interval (seconds)</label>
              <input
                type="number"
                [value]="schema().autosave?.intervalSeconds || 30"
                (input)="autosavePropertyChanged.emit({property: 'intervalSeconds', value: Number($any($event.target).value)})"
                class="form-control"
                min="5"
                step="5"
              >
            </div>

            <div class="form-group">
              <label>Storage Type</label>
              <select
                [value]="schema().autosave?.storage || 'localStorage'"
                (change)="autosavePropertyChanged.emit({property: 'storage', value: $any($event.target).value})"
                class="form-control"
              >
                <option value="localStorage">Local Storage</option>
                <option value="sessionStorage">Session Storage</option>
              </select>
            </div>

            <div class="form-group">
              <label>Storage Key</label>
              <input
                type="text"
                [value]="schema().autosave?.key || ''"
                (input)="autosavePropertyChanged.emit({property: 'key', value: $any($event.target).value || undefined})"
                class="form-control"
                placeholder="custom-draft-key"
              >
              <small class="text-muted">Leave empty for auto-generated key</small>
            </div>

            <div class="form-group">
              <label>Expiration (days)</label>
              <input
                type="number"
                [value]="schema().autosave?.expirationDays || 7"
                (input)="autosavePropertyChanged.emit({property: 'expirationDays', value: Number($any($event.target).value)})"
                class="form-control"
                min="1"
              >
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="schema().autosave?.showIndicator !== false"
                  (change)="autosavePropertyChanged.emit({property: 'showIndicator', value: $any($event.target).checked})"
                >
                Show save indicator
              </label>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .form-settings-section {
      margin-bottom: var(--spacing-lg);
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--color-gray-200);
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .settings-group {
      padding: var(--spacing-md);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-gray-200);
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-md) 0;
    }

    .form-group {
      margin-bottom: var(--spacing-md);

      &:last-child {
        margin-bottom: 0;
      }

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

      textarea.form-control {
        resize: vertical;
        font-family: 'Courier New', monospace;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormSettingsEditorComponent {
  // Inputs
  schema = input.required<FormSchema>();

  // Outputs
  formPropertyChanged = output<{property: string; value: unknown}>();
  submissionPropertyChanged = output<{property: string; value: unknown}>();
  submissionHeadersJSONChanged = output<string>();
  autosavePropertyChanged = output<{property: string; value: unknown}>();

  protected readonly JSON = JSON;
  protected readonly Number = Number;
}
