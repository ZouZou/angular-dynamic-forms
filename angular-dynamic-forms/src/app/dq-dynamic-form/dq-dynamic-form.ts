import { Component, computed, inject, signal } from '@angular/core';
import { Field } from './models/field.model';
import { DynamicFormsService } from './dq-dynamic-form.service';

@Component({
  selector: 'dq-dynamic-form',
  imports: [],
  templateUrl: './dq-dynamic-form.html',
  styleUrl: './dq-dynamic-form.scss',
  providers: [DynamicFormsService],
})
export class DqDynamicForm {
  private readonly _formService = inject(DynamicFormsService);
  protected readonly fields = signal<Field[]>([]);
  protected readonly title = signal<string>('');
  protected readonly formValues = signal<Record<string, unknown>>({});
  protected readonly touched = signal<Record<string, boolean>>({});
  protected readonly submitted = signal(false);
  protected readonly submittedData = signal<Record<string, unknown> | null>(
    null
  );
  protected readonly loading = signal(true);

  // constructor(private readonly formService: DynamicFormsService) {}

  ngOnInit(): void {
    this._formService.getFormSchema().subscribe((schema) => {
      this.title.set(schema.title);
      this.fields.set(schema.fields);

      const initialValues: Record<string, unknown> = {};
      const initialTouched: Record<string, boolean> = {};

      for (const field of schema.fields) {
        initialValues[field.name] = field.type === 'checkbox' ? false : '';
        initialTouched[field.name] = false;
      }

      this.formValues.set(initialValues);
      this.touched.set(initialTouched);
      this.loading.set(false);
    });
  }

  updateFormValue(fieldName: string, value: unknown): void {
    this.formValues.update((current) => ({
      ...current,
      [fieldName]: value,
    }));

    this.touched.update((current) => ({
      ...current,
      [fieldName]: true,
    }));
  }

  readonly errors = computed<Record<string, string>>(() => {
    const validationErrors: Record<string, string> = {};
    const values = this.formValues();
    const fields = this.fields();

    for (const field of fields) {
      const fieldValue = values[field.name]; // meaningful name
      const rules = field.validations;

      if (rules?.required && !fieldValue) {
        validationErrors[field.name] = `${field.label} is required`;
      }

      if (
        rules?.minLength &&
        typeof fieldValue === 'string' &&
        fieldValue.length < rules.minLength
      ) {
        validationErrors[
          field.name
        ] = `${field.label} must be at least ${rules.minLength} characters`;
      }

      if (rules?.requiredTrue && fieldValue !== true) {
        validationErrors[field.name] = `${field.label} must be checked`;
      }
    }

    return validationErrors;
  });

  readonly isValid = computed<boolean>(
    () => Object.keys(this.errors()).length === 0
  );

  saveUserData(): void {
    this.submittedData.set(this.formValues());
    this.submitted.set(true);
    console.log('FORM VALUES (Signals):', this.formValues());
  }
}
