import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';
import { SHARED_FIELD_STYLES } from './shared-field-styles';

/**
 * Renders file upload fields with preview
 */
@Component({
  selector: 'dq-file-field',
  template: `
    <label class="form-label">
      {{ field().label }}
      @if (field().validations?.required) {
        <span class="required">*</span>
      }
    </label>
    <input
      type="file"
      class="form-file"
      [accept]="field().accept || ''"
      [multiple]="field().multiple || false"
      [disabled]="field().disabled || false"
      [attr.aria-required]="field().validations?.required || null"
      [attr.aria-invalid]="touched() && error() ? 'true' : null"
      [attr.aria-describedby]="error() ? 'error-' + field().name : null"
      (change)="onFileChange($any($event.target).files)"
      (blur)="onBlur()"
    />
    @if (field().maxFileSize) {
      <small class="text-muted">Max size: {{ maxFileSizeFormatted() }}</small>
    }
    @if (value() && filePreview()) {
      <div class="file-preview">
        @if (isImageFile()) {
          <img [src]="filePreview()" alt="Preview" class="image-preview" />
        } @else {
          <div class="file-info">
            <strong>{{ fileName() }}</strong>
            <small>{{ fileSizeFormatted() }}</small>
          </div>
        }
      </div>
    }
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .form-file {
        padding: 8px 12px;
        border: 2px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        background-color: white;
        font-size: 0.9375rem;
        width: 100%;
        cursor: pointer;
        transition: border-color var(--transition-fast);
      }

      .form-file:hover {
        border-color: var(--color-primary);
      }

      .form-file:focus,
      .form-file:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }

      .form-file:disabled {
        background-color: var(--color-gray-100);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .text-muted {
        display: block;
        font-size: 0.8125rem;
        color: var(--color-gray-500);
        margin-top: var(--spacing-xs);
      }

      .file-preview {
        margin-top: var(--spacing-md);
        padding: var(--spacing-md);
        border: 2px dashed var(--color-gray-300);
        border-radius: var(--radius-md);
        background-color: var(--color-gray-50);
      }

      .image-preview {
        max-width: 100%;
        max-height: 300px;
        border-radius: var(--radius-sm);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .file-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .file-info strong {
        color: var(--color-gray-800);
        font-size: 0.9375rem;
      }

      .file-info small {
        color: var(--color-gray-500);
        font-size: 0.8125rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileFieldComponent {
  // Inputs
  field = input.required<Field>();
  value = input<unknown>(null);
  touched = input<boolean>(false);
  error = input<string | null>(null);
  filePreview = input<string>('');
  fileName = input<string>('');
  fileSizeFormatted = input<string>('');
  maxFileSizeFormatted = input<string>('');
  isImageFile = input<boolean>(false);

  // Outputs
  fileChange = output<{ fieldName: string; files: FileList | null }>();
  blur = output<string>();

  protected onFileChange(files: FileList | null): void {
    this.fileChange.emit({
      fieldName: this.field().name,
      files: files
    });
  }

  protected onBlur(): void {
    this.blur.emit(this.field().name);
  }
}
