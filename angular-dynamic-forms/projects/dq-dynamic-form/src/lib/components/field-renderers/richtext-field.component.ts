import { Component, input, output, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders rich text editor fields with toolbar
 */
@Component({
  selector: 'dq-richtext-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <div class="richtext-toolbar">
      <button type="button" (click)="execCommand('bold')" title="Bold">B</button>
      <button type="button" (click)="execCommand('italic')" title="Italic">I</button>
      <button type="button" (click)="execCommand('underline')" title="Underline">U</button>
      <button type="button" (click)="execCommand('insertUnorderedList')" title="Bullet List">•</button>
      <button type="button" (click)="execCommand('insertOrderedList')" title="Numbered List">1.</button>
    </div>
    <div
      class="richtext-editor"
      contenteditable="true"
      [id]="'richtext-' + field().name"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      [innerHTML]="sanitizedValue()"
      (input)="onInput($any($event.target).innerHTML)"
      (blur)="onBlur()"
    ></div>
    @if (field().maxCharacters) {
      <small class="text-muted">
        {{ currentLength() }} / {{ field().maxCharacters }} characters
      </small>
    }
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .richtext-toolbar {
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
        background-color: var(--color-gray-100);
        border: 2px solid var(--color-gray-300);
        border-bottom: none;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
      }

      .richtext-toolbar button {
        padding: 6px 12px;
        background-color: white;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-sm);
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .richtext-toolbar button:hover {
        background-color: var(--color-gray-50);
        border-color: var(--color-primary);
      }

      .richtext-toolbar button:focus,
      .richtext-toolbar button:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .richtext-editor {
        min-height: 150px;
        padding: 12px 16px;
        border: 2px solid var(--color-gray-300);
        border-radius: 0 0 var(--radius-md) var(--radius-md);
        background-color: white;
        font-size: 1rem;
        line-height: 1.6;
        overflow-y: auto;
        transition: border-color var(--transition-fast);
      }

      .richtext-editor:focus,
      .richtext-editor:focus-visible {
        outline: none;
        border-color: var(--color-primary);
      }

      .richtext-editor:empty:before {
        content: attr(placeholder);
        color: var(--color-gray-400);
        font-style: italic;
      }

      .text-muted {
        display: block;
        font-size: 0.8125rem;
        color: var(--color-gray-500);
        margin-top: var(--spacing-xs);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichtextFieldComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // Inputs
  field = input.required<Field>();
  value = input<unknown>('');
  touched = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

  // Sanitized HTML value to prevent XSS
  protected readonly sanitizedValue = computed(() => {
    const val = this.value();
    if (!val || typeof val !== 'string') return '';
    return this.sanitizer.sanitize(1, val) || ''; // 1 = SecurityContext.HTML
  });

  // Computed current text length (strips HTML)
  protected readonly currentLength = computed(() => {
    return this.getRichTextLength(this.value());
  });

  protected onInput(newValue: string): void {
    this.valueChange.emit({
      fieldName: this.field().name,
      value: newValue
    });
  }

  protected execCommand(command: string): void {
    document.execCommand(command, false);
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }

  private getRichTextLength(html: unknown): number {
    if (!html || typeof html !== 'string') return 0;
    // Sanitize HTML before using innerHTML to prevent XSS
    const sanitized = this.sanitizer.sanitize(1, html); // 1 = SecurityContext.HTML
    if (!sanitized) return 0;
    const div = document.createElement('div');
    div.innerHTML = sanitized;
    return div.textContent?.length || 0;
  }
}
