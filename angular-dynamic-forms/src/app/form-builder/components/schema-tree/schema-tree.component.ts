import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Field, FormSection } from 'dq-dynamic-form';

/**
 * Displays the schema tree with sections/fields and drag-and-drop support
 */
@Component({
  selector: 'fb-schema-tree',
  imports: [CommonModule, DragDropModule],
  template: `
    @if (multiStepMode()) {
      <!-- Multi-Step Mode: Sections -->
      <section class="tree-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>Form Sections ({{ sections().length }})</h3>
          <button class="btn btn-sm btn-primary" (click)="addSectionClicked.emit()" title="Add Section">
            ➕ Add Section
          </button>
        </div>

        <div
          class="sections-tree"
          cdkDropList
          (cdkDropListDropped)="onSectionDrop($event)"
        >
          @if (sections().length === 0) {
            <div class="empty-state">
              <p>No sections yet. Click "Add Section" to create one.</p>
            </div>
          } @else {
            @for (section of sections(); track $index) {
              <div class="section-item" cdkDrag [class.selected]="selectedSectionIndex() === $index">
                <div
                  class="section-header"
                  (click)="sectionSelected.emit($index)"
                >
                  <div class="drag-handle" cdkDragHandle>
                    <span class="drag-icon">⋮⋮</span>
                  </div>
                  <div class="section-info">
                    <span class="section-icon">{{ section.icon || '📋' }}</span>
                    <div class="section-details">
                      <div class="section-title">{{ section.title }}</div>
                      <div class="section-meta">{{ section.fields.length }} fields</div>
                    </div>
                  </div>
                  <div class="section-actions">
                    <button
                      class="btn-icon btn-danger"
                      (click)="sectionRemoved.emit($index); $event.stopPropagation()"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <!-- Fields in this section -->
                @if (selectedSectionIndex() === $index) {
                  <div class="section-fields">
                    <div class="section-fields-header">
                      <h4>Fields in this section</h4>
                    </div>

                    @if (section.fields.length === 0) {
                      <div class="empty-state-small">
                        <p>No fields yet. Add fields from the palette above.</p>
                      </div>
                    } @else {
                      <div
                        cdkDropList
                        (cdkDropListDropped)="onFieldDrop($event)"
                      >
                        @for (field of section.fields; track $index) {
                          <div
                            class="field-item"
                            cdkDrag
                            [class.selected]="selectedFieldIndex() === $index"
                            (click)="fieldSelected.emit($index)"
                          >
                            <div class="drag-handle" cdkDragHandle>
                              <span class="drag-icon">⋮⋮</span>
                            </div>
                            <div class="field-item-content">
                              <span class="field-icon">{{ getFieldIcon(field.type) }}</span>
                              <div class="field-info">
                                <div class="field-name">{{ field.name }}</div>
                                <div class="field-label">{{ field.label }}</div>
                              </div>
                            </div>
                            <div class="field-actions">
                              <button
                                class="btn-icon btn-danger"
                                (click)="fieldRemoved.emit($index); $event.stopPropagation()"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                            <div class="drag-placeholder" *cdkDragPlaceholder></div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                <div class="drag-placeholder" *cdkDragPlaceholder></div>
              </div>
            }
          }
        </div>
      </section>
    } @else {
      <!-- Single-Step Mode: Fields -->
      <section class="tree-section">
        <h3>Form Fields ({{ fields().length }})</h3>
        <div
          class="field-tree"
          cdkDropList
          (cdkDropListDropped)="onFieldDrop($event)"
        >
          @if (fields().length === 0) {
            <div class="empty-state">
              <p>👆 Click a field type above to add it to your form</p>
            </div>
          } @else {
            @for (field of fields(); track $index) {
              <div
                class="field-item"
                cdkDrag
                [class.selected]="selectedFieldIndex() === $index"
                (click)="fieldSelected.emit($index)"
              >
                <div class="drag-handle" cdkDragHandle>
                  <span class="drag-icon">⋮⋮</span>
                </div>
                <div class="field-item-content">
                  <span class="field-icon">{{ getFieldIcon(field.type) }}</span>
                  <div class="field-info">
                    <div class="field-name">{{ field.name }}</div>
                    <div class="field-label">{{ field.label }}</div>
                  </div>
                </div>
                <div class="field-actions">
                  <button
                    class="btn-icon btn-danger"
                    (click)="fieldRemoved.emit($index); $event.stopPropagation()"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
                <div class="drag-placeholder" *cdkDragPlaceholder></div>
              </div>
            }
          }
        </div>
      </section>
    }
  `,
  styleUrl: './schema-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaTreeComponent {
  // Inputs
  multiStepMode = input.required<boolean>();
  sections = input<FormSection[]>([]);
  fields = input<Field[]>([]);
  selectedSectionIndex = input<number | null>(null);
  selectedFieldIndex = input<number | null>(null);
  fieldIconMap = input<Map<string, string>>(new Map());

  // Outputs
  sectionSelected = output<number>();
  sectionRemoved = output<number>();
  addSectionClicked = output<void>();
  sectionDropped = output<CdkDragDrop<FormSection[]>>();

  fieldSelected = output<number>();
  fieldRemoved = output<number>();
  fieldDropped = output<CdkDragDrop<Field[]>>();

  protected getFieldIcon(fieldType: string): string {
    return this.fieldIconMap().get(fieldType) || '📝';
  }

  protected onSectionDrop(event: CdkDragDrop<FormSection[]>): void {
    this.sectionDropped.emit(event);
  }

  protected onFieldDrop(event: CdkDragDrop<Field[]>): void {
    this.fieldDropped.emit(event);
  }
}
