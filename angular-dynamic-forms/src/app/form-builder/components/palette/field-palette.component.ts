import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from 'dq-dynamic-form';

export interface FieldTemplate {
  type: string;
  label: string;
  icon: string;
  defaultConfig: Partial<Field>;
}

/**
 * Displays the field palette with all available field types
 */
@Component({
  selector: 'fb-field-palette',
  template: `
    <section class="palette-section">
      <h3>Field Palette</h3>
      <div class="field-palette">
        @for (template of templates(); track template.type) {
          <button
            class="palette-item"
            (click)="fieldSelected.emit(template)"
            [title]="'Add ' + template.label"
          >
            <span class="palette-icon">{{ template.icon }}</span>
            <span class="palette-label">{{ template.label }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .palette-section {
      margin-bottom: var(--spacing-lg);
    }

    .palette-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--color-gray-200);
    }

    .field-palette {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--spacing-sm);
    }

    .palette-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-md);
      background: white;
      border: 2px solid var(--color-gray-300);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      min-height: 80px;
    }

    .palette-item:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .palette-item:active {
      transform: translateY(0);
    }

    .palette-icon {
      font-size: 1.5rem;
    }

    .palette-label {
      font-size: 0.75rem;
      font-weight: 500;
      text-align: center;
      color: var(--color-gray-700);
      line-height: 1.2;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldPaletteComponent {
  // Inputs
  templates = input.required<FieldTemplate[]>();

  // Outputs
  fieldSelected = output<FieldTemplate>();
}
