import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from '../../models/field.model';

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
