import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field, FormSection } from 'dq-dynamic-form';

/**
 * Editor for basic field properties: name, label, placeholder, flags, and layout
 */
@Component({
  selector: 'fb-basic-field-editor',
  template: `
    <section class="properties-section">
      <h3>⚙️ Field Properties</h3>
      <div class="properties-form">
        <div class="form-group">
          <label>Field Name</label>
          <input
            type="text"
            [value]="field().name"
            (input)="fieldPropertyChanged.emit({property: 'name', value: $any($event.target).value})"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Label</label>
          <input
            type="text"
            [value]="field().label"
            (input)="fieldPropertyChanged.emit({property: 'label', value: $any($event.target).value})"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Placeholder</label>
          <input
            type="text"
            [value]="field().placeholder || ''"
            (input)="fieldPropertyChanged.emit({property: 'placeholder', value: $any($event.target).value})"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().validations?.required || false"
              (change)="requiredToggled.emit($any($event.target).checked)"
            >
            Required
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().readonly || false"
              (change)="fieldPropertyChanged.emit({property: 'readonly', value: $any($event.target).checked})"
            >
            Read Only
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              [checked]="field().disabled || false"
              (change)="fieldPropertyChanged.emit({property: 'disabled', value: $any($event.target).checked})"
            >
            Disabled
          </label>
        </div>

        <!-- Layout & Styling -->
        <div class="advanced-section">
          <h4>🎨 Layout & Styling</h4>

          <div class="form-group">
            <label>Field Width</label>
            <select
              [value]="field().width || 'full'"
              (change)="fieldPropertyChanged.emit({property: 'width', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">Third Width</option>
              <option value="quarter">Quarter Width</option>
            </select>
          </div>

          <div class="form-group">
            <label>Custom CSS Class</label>
            <input
              type="text"
              [value]="field().cssClass || ''"
              (input)="fieldPropertyChanged.emit({property: 'cssClass', value: $any($event.target).value || undefined})"
              class="form-control"
              placeholder="e.g., my-custom-class"
            >
          </div>

          @if (field().type === 'radio') {
            <div class="form-group">
              <label>Layout</label>
              <select
                [value]="field().layout || 'vertical'"
                (change)="fieldPropertyChanged.emit({property: 'layout', value: $any($event.target).value})"
                class="form-control"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
          }
        </div>

        <!-- Move to Section (Multi-Step Mode) -->
        @if (multiStepMode() && sections().length > 1) {
          <div class="form-group">
            <label>Move to Section</label>
            <select
              class="form-control"
              (change)="moveFieldToSection.emit(Number($any($event.target).value))"
            >
              <option value="" disabled selected>-- Select Section --</option>
              @for (section of sections(); track $index) {
                @if ($index !== currentSectionIndex()) {
                  <option [value]="$index">{{ section.title }}</option>
                }
              }
            </select>
          </div>
        }
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

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .properties-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .advanced-section {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid #ddd;
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

      input[type="checkbox"] {
        width: auto;
        margin-right: var(--spacing-xs);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicFieldEditorComponent {
  // Inputs
  field = input.required<Field>();
  multiStepMode = input.required<boolean>();
  sections = input<FormSection[]>([]);
  currentSectionIndex = input<number | null>(null);

  // Outputs
  fieldPropertyChanged = output<{property: string; value: unknown}>();
  requiredToggled = output<boolean>();
  moveFieldToSection = output<number>();

  protected readonly Number = Number;
}
