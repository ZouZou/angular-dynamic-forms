import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DqDynamicForm } from './dq-dynamic-form';
import { Field, FormSchema } from './models/field.model';
import { signal } from '@angular/core';

describe('DqDynamicForm', () => {
  let component: DqDynamicForm;
  let fixture: ComponentFixture<DqDynamicForm>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DqDynamicForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DqDynamicForm);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty fields when no schema provided', async () => {
      await fixture.whenStable();
      expect(component['fields']()).toEqual([]);
    });

    it('should load schema from JSON file', async () => {
      fixture.detectChanges();

      const mockSchema = {
        title: 'Test Form',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      const req = httpMock.expectOne('/forms/sample-form.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockSchema);

      await fixture.whenStable();

      expect(component['title']()).toBe('Test Form');
      expect(component['fields']().length).toBe(1);
      expect(component['fields']()[0].name).toBe('username');
    });

    it('should accept schema via input', async () => {
      const schema: FormSchema = {
        title: 'Input Schema',
        fields: [
          { type: 'email', name: 'email', label: 'Email' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['title']()).toBe('Input Schema');
      expect(component['fields']().length).toBe(1);
    });
  });

  describe('Field Types - Text Inputs', () => {
    it('should render text field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'firstName', label: 'First Name' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input[name="firstName"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('text');
    });

    it('should render email field with email type', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'email', name: 'email', label: 'Email' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[name="email"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('email');
    });

    it('should render password field with password type', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'password', name: 'password', label: 'Password' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[name="password"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });

    it('should render textarea field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'textarea', name: 'bio', label: 'Bio', rows: 5 }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const textarea = fixture.nativeElement.querySelector('textarea[name="bio"]');
      expect(textarea).toBeTruthy();
      expect(textarea.rows).toBe(5);
    });
  });

  describe('Field Types - Number and Date', () => {
    it('should render number field with constraints', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'number', name: 'age', label: 'Age', min: 0, max: 120, step: 1 }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[name="age"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('number');
      expect(input.min).toBe('0');
      expect(input.max).toBe('120');
      expect(input.step).toBe('1');
    });

    it('should render date field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'date', name: 'birthDate', label: 'Birth Date' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[name="birthDate"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('date');
    });

    it('should render datetime field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'datetime', name: 'appointment', label: 'Appointment' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[name="appointment"]');
      expect(input).toBeTruthy();
      expect(input.type).toBe('datetime-local');
    });
  });

  describe('Field Types - Selection', () => {
    it('should render select field with options', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'select',
            name: 'country',
            label: 'Country',
            options: [
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const select = fixture.nativeElement.querySelector('select[name="country"]');
      expect(select).toBeTruthy();
      const options = select.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(2); // includes placeholder
    });

    it('should render radio buttons', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'radio',
            name: 'gender',
            label: 'Gender',
            options: [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const radios = fixture.nativeElement.querySelectorAll('input[type="radio"][name="gender"]');
      expect(radios.length).toBe(2);
    });

    it('should render checkbox field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'checkbox', name: 'terms', label: 'Accept Terms' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"][name="terms"]');
      expect(checkbox).toBeTruthy();
    });

    it('should render multiselect field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'multiselect',
            name: 'skills',
            label: 'Skills',
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'ts', label: 'TypeScript' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const select = fixture.nativeElement.querySelector('select[name="skills"]');
      expect(select).toBeTruthy();
      expect(select.multiple).toBe(true);
    });
  });

  describe('Field Types - Advanced', () => {
    it('should render range slider', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'range', name: 'volume', label: 'Volume', min: 0, max: 100, step: 5 }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[type="range"][name="volume"]');
      expect(input).toBeTruthy();
      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
      expect(input.step).toBe('5');
    });

    it('should render color picker', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'color', name: 'brandColor', label: 'Brand Color' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[type="color"][name="brandColor"]');
      expect(input).toBeTruthy();
    });

    it('should render file upload', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'file', name: 'avatar', label: 'Avatar', accept: 'image/*' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input[type="file"][name="avatar"]');
      expect(input).toBeTruthy();
      expect(input.accept).toBe('image/*');
    });

    it('should render rich text editor', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'richtext', name: 'content', label: 'Content' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const editor = fixture.nativeElement.querySelector('[contenteditable="true"]');
      expect(editor).toBeTruthy();
    });
  });

  describe('Validations - Required Fields', () => {
    it('should show error for empty required text field', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      // Trigger form submission
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['username']).toBeDefined();
      expect(errors['username']).toContain('required');
    });

    it('should validate minLength', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { minLength: 5 } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ username: 'abc' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['username']).toContain('at least 5');
    });

    it('should validate maxLength', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { maxLength: 10 } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ username: 'verylongusername' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['username']).toContain('maximum');
    });

    it('should validate email format', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'email', name: 'email', label: 'Email', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ email: 'invalid-email' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['email']).toContain('valid email');
    });

    it('should validate requiredTrue for checkbox', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'checkbox', name: 'terms', label: 'Accept Terms', validations: { requiredTrue: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ terms: false });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['terms']).toBeDefined();
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate matchesField (password confirmation)', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'password', name: 'password', label: 'Password' },
          {
            type: 'password',
            name: 'confirmPassword',
            label: 'Confirm Password',
            validations: { matchesField: 'password' }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ password: 'test123', confirmPassword: 'test456' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['confirmPassword']).toContain('match');
    });

    it('should validate greaterThanField', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'date', name: 'startDate', label: 'Start Date' },
          {
            type: 'date',
            name: 'endDate',
            label: 'End Date',
            validations: { greaterThanField: 'startDate' }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ startDate: '2025-12-31', endDate: '2025-01-01' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['endDate']).toBeDefined();
    });

    it('should validate requiredIf condition', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'checkbox', name: 'hasReferral', label: 'Has Referral' },
          {
            type: 'text',
            name: 'referralCode',
            label: 'Referral Code',
            validations: {
              requiredIf: {
                field: 'hasReferral',
                operator: 'equals',
                value: true
              }
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ hasReferral: true, referralCode: '' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['referralCode']).toContain('required');
    });
  });

  describe('Conditional Visibility', () => {
    it('should hide field when condition is false', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'select',
            name: 'accountType',
            label: 'Account Type',
            options: [
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' }
            ]
          },
          {
            type: 'text',
            name: 'companyName',
            label: 'Company Name',
            visibleWhen: {
              field: 'accountType',
              operator: 'equals',
              value: 'business'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ accountType: 'personal' });
      fixture.detectChanges();

      const isVisible = component['isFieldVisible'](schema.fields![1]);
      expect(isVisible).toBe(false);
    });

    it('should show field when condition is true', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'select',
            name: 'accountType',
            label: 'Account Type',
            options: [
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' }
            ]
          },
          {
            type: 'text',
            name: 'companyName',
            label: 'Company Name',
            visibleWhen: {
              field: 'accountType',
              operator: 'equals',
              value: 'business'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ accountType: 'business' });
      fixture.detectChanges();

      const isVisible = component['isFieldVisible'](schema.fields![1]);
      expect(isVisible).toBe(true);
    });

    it('should evaluate complex AND conditions', async () => {
      const field: Field = {
        type: 'text',
        name: 'studentId',
        label: 'Student ID',
        visibleWhen: {
          operator: 'and',
          conditions: [
            { field: 'age', operator: 'lessThan', value: 25 },
            { field: 'accountType', operator: 'equals', value: 'student' }
          ]
        }
      };

      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'number', name: 'age', label: 'Age' },
          { type: 'text', name: 'accountType', label: 'Account Type' },
          field
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ age: 20, accountType: 'student' });
      expect(component['isFieldVisible'](field)).toBe(true);

      component['formValues'].set({ age: 30, accountType: 'student' });
      expect(component['isFieldVisible'](field)).toBe(false);
    });
  });

  describe('Computed Fields', () => {
    it('should calculate computed field value', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'number', name: 'price', label: 'Price' },
          { type: 'number', name: 'quantity', label: 'Quantity' },
          {
            type: 'text',
            name: 'total',
            label: 'Total',
            readonly: true,
            computed: {
              formula: 'price * quantity',
              dependencies: ['price', 'quantity'],
              formatAs: 'number',
              decimal: 2
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ price: 10, quantity: 5 });
      fixture.detectChanges();

      const values = component['formValues']();
      expect(values['total']).toBe('50.00');
    });

    it('should concatenate string fields', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'firstName', label: 'First Name' },
          { type: 'text', name: 'lastName', label: 'Last Name' },
          {
            type: 'text',
            name: 'fullName',
            label: 'Full Name',
            readonly: true,
            computed: {
              formula: 'firstName + " " + lastName',
              dependencies: ['firstName', 'lastName'],
              formatAs: 'text'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ firstName: 'John', lastName: 'Doe' });
      fixture.detectChanges();

      const values = component['formValues']();
      expect(values['fullName']).toBe('John Doe');
    });
  });

  describe('Autosave', () => {
    it('should enable autosave when configured', async () => {
      const schema: FormSchema = {
        title: 'Test',
        autosave: {
          enabled: true,
          intervalSeconds: 30,
          storage: 'localStorage'
        },
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['autosaveEnabled']()).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with validation errors', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(component['submitted']()).toBe(false);
      const errors = component['errors']();
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('should submit valid form', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ username: 'testuser' });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('Dynamic Array Fields', () => {
    it('should render array field with initial items', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'array',
            name: 'phoneNumbers',
            label: 'Phone Numbers',
            arrayConfig: {
              fields: [
                { type: 'text', name: 'number', label: 'Number' }
              ],
              initialItems: 2,
              minItems: 1,
              maxItems: 5
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      const arrayItems = fixture.nativeElement.querySelectorAll('.array-item');
      expect(arrayItems.length).toBe(2);
    });
  });

  describe('Multiselect Validation', () => {
    it('should validate minSelections', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'multiselect',
            name: 'skills',
            label: 'Skills',
            minSelections: 2,
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'ts', label: 'TypeScript' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ skills: ['js'] });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['skills']).toContain('at least 2');
    });

    it('should validate maxSelections', async () => {
      const schema: FormSchema = {
        title: 'Test',
        fields: [
          {
            type: 'multiselect',
            name: 'skills',
            label: 'Skills',
            maxSelections: 2,
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'ts', label: 'TypeScript' },
              { value: 'py', label: 'Python' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      component['formValues'].set({ skills: ['js', 'ts', 'py'] });

      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      const errors = component['errors']();
      expect(errors['skills']).toContain('maximum');
    });
  });
});
