import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormSection } from 'dq-dynamic-form';

/**
 * Editor for section properties in multi-step forms
 */
@Component({
  selector: 'fb-section-editor',
  template: `
    <section class="properties-section">
      <h3>📋 Section Properties</h3>
      <div class="properties-form">
        <div class="form-group">
          <label>Section Title</label>
          <input
            type="text"
            [value]="section().title"
            (input)="sectionPropertyChanged.emit({property: 'title', value: $any($event.target).value})"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea
            [value]="section().description || ''"
            (input)="sectionPropertyChanged.emit({property: 'description', value: $any($event.target).value})"
            class="form-control"
            rows="2"
            placeholder="Optional description for this step"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Icon (emoji or text)</label>
          <input
            type="text"
            [value]="section().icon || ''"
            (input)="sectionPropertyChanged.emit({property: 'icon', value: $any($event.target).value})"
            class="form-control"
            placeholder="e.g., 📋, 👤, 🔐"
          >
        </div>
      </div>
    </section>
  `,
  styles: [`
    .properties-section {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-gray-200);
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-md) 0;
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--color-gray-200);
    }

    .properties-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .form-group {
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
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionEditorComponent {
  // Inputs
  section = input.required<FormSection>();

  // Outputs
  sectionPropertyChanged = output<{property: string; value: unknown}>();
}
