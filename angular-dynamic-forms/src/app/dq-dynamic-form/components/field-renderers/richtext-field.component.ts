import { Component, input, output, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Field } from '../../models/field.model';

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
      [innerHTML]="value() || ''"
      (input)="onInput($any($event.target).innerHTML)"
      (blur)="onBlur()"
    ></div>
    @if (field().maxCharacters) {
      <small class="text-muted">
        {{ currentLength() }} / {{ field().maxCharacters }} characters
      </small>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichtextFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>('');
  touched = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  valueChange = output<{ fieldName: string; value: unknown }>();
  blur = output<string>();

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
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  }
}
